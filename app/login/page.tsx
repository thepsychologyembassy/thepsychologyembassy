"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import SocialLoginButtons from "../../components/SocialLoginButtons";
import OtpVerifyForm from "../../components/OtpVerifyForm";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Where to send the user after they log in. Defaults to the dashboard,
  // but if they were bounced here from a gated page (e.g. /tools/some-test),
  // we send them right back to it instead of losing their place.
  const redirectTarget = (() => {
    const raw = searchParams.get("redirect");
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
    return raw;
  })();
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error || "Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }

      // Our rate-limited server route did the actual sign-in - hand its
      // tokens to the browser client so the session sticks around normally.
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });

      if (sessionError) {
        setErrorMsg(sessionError.message);
        setIsLoading(false);
        return;
      }

      router.push(redirectTarget);
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMsg("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // shouldCreateUser: false -> only existing, verified accounts can use this,
    // so this can never be used to silently create new unverified accounts.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      setOtpStep("verify");
      setIsLoading(false);
    }
  };

  const switchMode = (next: "password" | "otp") => {
    setMode(next);
    setOtpStep("request");
    setErrorMsg("");
  };

  return (
    <main className="relative isolate flex min-h-screen flex-col bg-[#FBF8F2] text-[#3A3A38]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#CFE3E8]/30 via-[#FBF8F2] to-[#FBF8F2]" />
      <Navbar />

      <div className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white/60 shadow-sm backdrop-blur-xl">
          
          <div className="border-b border-[#88B7B5]/20 bg-[#88B7B5]/10 px-8 py-8 text-center">
            <h1 className="font-serif text-3xl font-medium text-[#2C4C5B]">Welcome Back</h1>
            <p className="mt-2 text-sm text-[#3A3A38]/70">Log in to manage your appointments.</p>
          </div>

          {mode === "otp" && otpStep === "verify" ? (
            <OtpVerifyForm
              email={email}
              type="email"
              onVerified={() => router.push(redirectTarget)}
            />
          ) : (
            <div className="flex flex-col gap-6 px-8 py-10">
              <SocialLoginButtons redirectTo={redirectTarget} />

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-[#3A3A38]/10" />
                <span className="text-xs uppercase tracking-widest text-[#3A3A38]/40">or</span>
                <div className="h-px flex-1 bg-[#3A3A38]/10" />
              </div>

              <div className="flex rounded-full bg-[#3A3A38]/5 p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => switchMode("password")}
                  className={`flex-1 rounded-full py-2 transition ${mode === "password" ? "bg-white shadow-sm text-[#2C4C5B]" : "text-[#3A3A38]/60"}`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("otp")}
                  className={`flex-1 rounded-full py-2 transition ${mode === "otp" ? "bg-white shadow-sm text-[#2C4C5B]" : "text-[#3A3A38]/60"}`}
                >
                  Email Code
                </button>
              </div>

              {mode === "password" ? (
                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">Email</label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:bg-white focus:outline-none" 
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">Password</label>
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:bg-white focus:outline-none" 
                    />
                  </div>

                  {errorMsg && <p className="text-center text-sm font-medium text-red-500">{errorMsg}</p>}

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="mt-2 w-full rounded-full bg-[#2C4C5B] py-4 text-sm font-medium tracking-wide text-[#FBF8F2] transition-transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? "Authenticating..." : "Log In"}
                  </button>

                  <p className="mt-4 text-center text-sm text-[#3A3A38]/70">
                    Don't have an account? <Link href={`/signup${redirectTarget && redirectTarget !== "/" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`} className="font-semibold text-[#4F6F52] hover:underline">Sign Up</Link>
                  </p>
                  <Link href="/forgot-password" className="text-sm text-[#4F6F52] hover:underline">
                    Forgot password?
                  </Link>
                </form>
              ) : (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">Email</label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:bg-white focus:outline-none" 
                    />
                  </div>

                  <p className="text-xs text-[#3A3A38]/60">We'll email you a 6-digit code — no password needed.</p>

                  {errorMsg && <p className="text-center text-sm font-medium text-red-500">{errorMsg}</p>}

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="mt-2 w-full rounded-full bg-[#2C4C5B] py-4 text-sm font-medium tracking-wide text-[#FBF8F2] transition-transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? "Sending Code..." : "Send Code"}
                  </button>

                  <p className="mt-4 text-center text-sm text-[#3A3A38]/70">
                    Don't have an account? <Link href={`/signup${redirectTarget && redirectTarget !== "/" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`} className="font-semibold text-[#4F6F52] hover:underline">Sign Up</Link>
                  </p>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}