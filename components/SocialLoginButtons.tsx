"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

type Provider = "google" | "azure" | "facebook" | "apple";

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
  {
    id: "facebook",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07Z" />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Apple",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#000000">
        <path d="M17.05 12.5c-.03-2.7 2.2-4 2.3-4.06-1.25-1.83-3.2-2.08-3.9-2.1-1.66-.17-3.24 1-4.08 1-.84 0-2.14-.98-3.52-.95-1.8.03-3.47 1.05-4.4 2.67-1.88 3.26-.48 8.08 1.35 10.72.9 1.29 1.97 2.74 3.37 2.69 1.35-.05 1.86-.87 3.5-.87 1.63 0 2.1.87 3.53.84 1.46-.02 2.38-1.32 3.27-2.62 1.03-1.5 1.46-2.96 1.48-3.03-.03-.02-2.85-1.09-2.9-4.29ZM14.4 4.6c.74-.9 1.24-2.15 1.1-3.4-1.07.04-2.36.71-3.13 1.6-.69.8-1.29 2.08-1.13 3.3 1.2.09 2.42-.6 3.16-1.5Z" />
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