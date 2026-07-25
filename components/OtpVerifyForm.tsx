"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { EmailOtpType } from "@supabase/supabase-js";

export default function OtpVerifyForm({
  email,
  type,
  onVerified,
}: {
  email: string;
  /** "signup" when confirming a brand-new account, "email" for a passwordless login code */
  type: EmailOtpType;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type,
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      onVerified();
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMsg("");
    setInfoMsg("");

    const { error } =
      type === "signup"
        ? await supabase.auth.resend({ type: "signup", email })
        : await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setInfoMsg("A new code is on its way to your inbox.");
    }
    setIsResending(false);
  };

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-6 px-8 py-10">
      <p className="text-center text-sm text-[#3A3A38]/70">
        Enter the 6-digit code we sent to <span className="font-semibold text-[#3A3A38]">{email}</span>
      </p>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">Verification Code</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-center text-lg tracking-[0.5em] text-[#3A3A38] focus:border-[#4F6F52] focus:bg-white focus:outline-none"
          placeholder="------"
        />
      </div>

      {errorMsg && <p className="text-center text-sm font-medium text-red-500">{errorMsg}</p>}
      {infoMsg && <p className="text-center text-sm font-medium text-[#4F6F52]">{infoMsg}</p>}

      <button
        type="submit"
        disabled={isLoading || code.length !== 6}
        className="mt-2 w-full rounded-full bg-[#2C4C5B] py-4 text-sm font-medium tracking-wide text-[#FBF8F2] transition-transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50"
      >
        {isLoading ? "Verifying..." : "Verify & Continue"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={isResending}
        className="text-center text-sm text-[#4F6F52] hover:underline disabled:opacity-50"
      >
        {isResending ? "Sending..." : "Didn't get a code? Resend"}
      </button>
    </form>
  );
}