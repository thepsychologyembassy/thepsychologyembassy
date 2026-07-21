"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "te_seen_get15off_envelope";
const COUPON_CODE = "GET15OFF";

export default function FirstTimeCouponPopup() {
  const [visible, setVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const decide = async () => {
      // Don't show it again once they've seen/dismissed it on this device.
      if (typeof window === "undefined") return;
      if (window.localStorage.getItem(STORAGE_KEY)) return;

      // If they're logged in and already have a paid session, this offer
      // doesn't apply to them - don't show it.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const { count } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("patient_email", user.email)
          .eq("status", "paid");

        if ((count || 0) > 0) return;
      }

      // Small delay so it doesn't slam into the page load.
      const timer = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(timer);
    };

    decide();
  }, []);

  const dismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable - no big deal, code is visible on screen
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open your welcome offer"
          className="group relative flex h-20 w-28 items-center justify-center drop-shadow-lg transition-transform hover:-translate-y-1"
        >
          {/* Envelope body */}
          <svg viewBox="0 0 120 80" className="h-full w-full">
            <rect x="2" y="2" width="116" height="76" rx="6" fill="#FBF8F2" stroke="#2C4C5B" strokeWidth="2" />
            <path d="M4 6 L60 46 L116 6" fill="none" stroke="#2C4C5B" strokeWidth="2" />
            <circle cx="60" cy="40" r="9" fill="#F6D86B" stroke="#2C4C5B" strokeWidth="1.5" />
          </svg>
          <span className="absolute -top-2 right-2 rounded-full bg-[#A65D47] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            For you
          </span>
        </button>
      ) : (
        <div className="w-80 max-w-[90vw] overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-start justify-between border-b border-[#88B7B5]/20 bg-[#88B7B5]/10 px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2C4C5B]">A welcome gift</p>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="text-[#3A3A38]/50 hover:text-[#3A3A38]"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
            <p className="font-serif text-2xl font-medium text-[#2C4C5B]">15% off your first session</p>
            <p className="text-sm text-[#3A3A38]/70">
              Use this code at checkout when you book your first appointment with us.
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="w-full rounded-xl border-2 border-dashed border-[#4F6F52] bg-[#4F6F52]/5 py-3 text-center font-mono text-lg font-bold tracking-widest text-[#4F6F52] transition-colors hover:bg-[#4F6F52]/10"
            >
              {copied ? "Copied!" : COUPON_CODE}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/50 hover:text-[#3A3A38]"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
