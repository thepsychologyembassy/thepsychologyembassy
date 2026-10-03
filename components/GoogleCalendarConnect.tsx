"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

interface GoogleCalendarConnectProps {
  // Where Google should send the user back to after the consent screen.
  // Pass the current page's path, e.g. "/dashboard" or "/counselor-portal".
  redirectPath: string;
}

// useSearchParams() requires a Suspense boundary in the Next.js app
// router (it reads from the URL at render time); wrapping it here means
// pages can just drop in <GoogleCalendarConnect /> without remembering
// to add their own boundary.
export default function GoogleCalendarConnect(props: GoogleCalendarConnectProps) {
  return (
    <Suspense fallback={null}>
      <GoogleCalendarConnectInner {...props} />
    </Suspense>
  );
}

function GoogleCalendarConnectInner({ redirectPath }: GoogleCalendarConnectProps) {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState<boolean | null>(null); // null = loading
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const authHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  const fetchStatus = async () => {
    try {
      const headers = await authHeader();
      const res = await fetch("/api/google-calendar/status", { headers });
      if (!res.ok) {
        setConnected(false);
        return;
      }
      const data = await res.json();
      setConnected(!!data.connected);
      setGoogleEmail(data.googleEmail || null);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show a one-time banner based on the ?calendar= query param the OAuth
  // callback redirects back with, then clean it out of the visible state
  // by just not re-reading it (no need to touch the URL itself).
  useEffect(() => {
    const result = searchParams?.get("calendar");
    if (result === "connected") {
      setBanner({ type: "success", text: "Google Calendar connected. We'll add a reminder for your sessions automatically." });
      fetchStatus();
    } else if (result === "error") {
      setBanner({ type: "error", text: "Couldn't connect Google Calendar. Please try again." });
    } else if (result === "cancelled") {
      setBanner({ type: "info", text: "Google Calendar connection cancelled." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleConnect = async () => {
    setIsWorking(true);
    try {
      const headers = await authHeader();
      const res = await fetch(
        `/api/google-calendar/connect?redirect=${encodeURIComponent(redirectPath)}`,
        { headers }
      );
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBanner({ type: "error", text: data.error || "Couldn't start Google Calendar connection." });
        setIsWorking(false);
      }
    } catch {
      setBanner({ type: "error", text: "Couldn't start Google Calendar connection." });
      setIsWorking(false);
    }
  };

  const handleDisconnect = async () => {
    setIsWorking(true);
    try {
      const headers = await authHeader();
      await fetch("/api/google-calendar/disconnect", {
        method: "POST",
        headers,
      });
      setConnected(false);
      setGoogleEmail(null);
      setBanner({ type: "info", text: "Google Calendar disconnected." });
    } catch {
      setBanner({ type: "error", text: "Couldn't disconnect. Please try again." });
    } finally {
      setIsWorking(false);
    }
  };

  if (connected === null) return null; // avoid a flash while status loads

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#3A3A38]/10 bg-white/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <svg className="h-8 w-8 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="17" rx="2" stroke="#2C4C5B" strokeWidth="1.5" />
            <path d="M3 9h18" stroke="#2C4C5B" strokeWidth="1.5" />
            <path d="M8 2v4M16 2v4" stroke="#2C4C5B" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="13" r="1.3" fill="#4F6F52" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-[#3A3A38]">Google Calendar</p>
            <p className="text-xs text-[#3A3A38]/60">
              {connected
                ? googleEmail
                  ? `Connected as ${googleEmail}`
                  : "Connected"
                : "Get an automatic reminder on Google Calendar for every booked session."}
            </p>
          </div>
        </div>

        {connected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isWorking}
            className="whitespace-nowrap rounded-full border border-[#3A3A38]/20 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/70 transition-colors hover:border-[#A65D47] hover:text-[#A65D47] disabled:opacity-50"
          >
            {isWorking ? "..." : "Disconnect"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={isWorking}
            className="whitespace-nowrap rounded-full bg-[#2C4C5B] px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#223c48] disabled:opacity-50"
          >
            {isWorking ? "Connecting..." : "Connect"}
          </button>
        )}
      </div>

      {banner && (
        <p
          className={`text-xs font-medium ${
            banner.type === "success"
              ? "text-[#4F6F52]"
              : banner.type === "error"
              ? "text-[#A65D47]"
              : "text-[#3A3A38]/60"
          }`}
        >
          {banner.text}
        </p>
      )}
    </div>
  );
}
