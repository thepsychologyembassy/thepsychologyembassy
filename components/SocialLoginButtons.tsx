"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

type Provider = "google" | "azure";

const PROVIDERS: { id: Provider; label: string; icon: React.ReactNode }[] = [
  {
    id: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3a7.4 7.4 0 0 1-11-3.9H1.09v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.07 14.19a7.2 7.2 0 0 1 0-4.38v-3.1H1.09a12 12 0 0 0 0 10.58l3.98-3.1Z" />
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.09 6.71l3.98 3.1A7.16 7.16 0 0 1 12 4.77Z" />
      </svg>
    ),
  },
  {
    id: "azure",
    label: "Microsoft",
    icon: (
      <svg viewBox="0 0 23 23" className="h-5 w-5">
        <rect x="1" y="1" width="10" height="10" fill="#F35325" />
        <rect x="12" y="1" width="10" height="10" fill="#81BC06" />
        <rect x="1" y="12" width="10" height="10" fill="#05A6F0" />
        <rect x="12" y="12" width="10" height="10" fill="#FFBA08" />
      </svg>
    ),
  },
];

export default function SocialLoginButtons({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOAuth = async (provider: Provider) => {
    setErrorMsg("");
    setLoadingProvider(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/confirm?next=${redirectTo}`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoadingProvider(null);
    }
    // On success, Supabase redirects the browser away to the provider,
    // so there's nothing further to do here.
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleOAuth(p.id)}
            disabled={loadingProvider !== null}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#3A3A38]/20 bg-white/70 px-4 py-3 text-sm font-medium text-[#3A3A38] transition hover:bg-white hover:shadow-sm disabled:opacity-50"
          >
            {p.icon}
            {loadingProvider === p.id ? "Redirecting..." : p.label}
          </button>
        ))}
      </div>
      {errorMsg && <p className="text-center text-sm font-medium text-red-500">{errorMsg}</p>}
    </div>
  );
}