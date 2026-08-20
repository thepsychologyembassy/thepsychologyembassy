"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

const SESSION_KEY = "te_seen_login_prompt";

// Pages where a "please log in" nudge doesn't make sense — auth pages
// themselves, and anything already gated/behind its own login redirect.
const EXCLUDED_PREFIXES = [
  "/login",
  "/signup",
  "/admin",
  "/dashboard",
  "/counselor-portal",
  "/book",
  "/pay",
  "/studio",
];

export default function LoginPromptModal() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const decide = async () => {
      if (typeof window === "undefined") return;

      // Once per browser session — don't nag on every page navigation.
      if (window.sessionStorage.getItem(SESSION_KEY)) return;

      if (EXCLUDED_PREFIXES.some((p) => pathname?.startsWith(p))) return;

      // Already logged in — nothing to prompt.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return;

      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    };

    decide();
    // Only re-evaluate when the route changes, e.g. a fresh landing page
    // in the same session before the prompt has fired yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const markSeen = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    }
  };

  const dismiss = () => {
    markSeen();
    setVisible(false);
  };

  const goToLogin = () => {
    markSeen();
    setVisible(false);
    const redirect = pathname && pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
    router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#3A3A38]/40 px-6 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-heading"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-start justify-between border-b border-[#88B7B5]/20 bg-[#88B7B5]/10 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2C4C5B]">Welcome</p>
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
          <h2 id="login-prompt-heading" className="font-serif text-2xl font-medium text-[#2C4C5B]">
            Log in to get the most out of your visit
          </h2>
          <p className="text-sm leading-relaxed text-[#3A3A38]/70">
            Sign in to book sessions, track your appointments, and pick up right where you left off.
          </p>
          <button
            type="button"
            onClick={goToLogin}
            className="w-full rounded-full bg-[#2C4C5B] py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#1E3A5F]"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/50 hover:text-[#3A3A38]"
          >
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}
