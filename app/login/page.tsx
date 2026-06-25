"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      // If successful, instantly send them to the Dashboard!
      router.push("/");
    }
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

          <form onSubmit={handleLogin} className="flex flex-col gap-6 px-8 py-10">
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
              Don't have an account? <Link href="/signup" className="font-semibold text-[#4F6F52] hover:underline">Sign Up</Link>
            </p>
          </form>

        </div>
      </div>
    </main>
  );
}