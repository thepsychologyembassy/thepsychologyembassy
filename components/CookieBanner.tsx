"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted cookies
    const hasAccepted = localStorage.getItem("cookieConsent");
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    // Floating centered pill with dark frosted glass
    <div className="fixed bottom-6 left-1/2 z-[9999] w-[95%] max-w-3xl -translate-x-1/2 rounded-2xl border border-[#FBF8F2]/10 bg-[#1A1C20]/85 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
        <p className="text-center text-sm leading-relaxed text-[#FBF8F2]/90 sm:text-left">
          We use cookies to ensure you get the best experience. By continuing to use this site, you consent to our use of cookies and our{" "}
          <Link href="/privacy" className="font-semibold text-[#88B7B5] underline transition-colors hover:text-[#FBF8F2]">
            Privacy Policy
          </Link>.
        </p>
        <button
          onClick={acceptCookies}
          className="whitespace-nowrap rounded-full bg-[#88B7B5] px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#1A1C20] transition-transform hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(136,183,181,0.2)] focus:outline-none"
        >
          Accept
        </button>
      </div>
    </div>
  );
}