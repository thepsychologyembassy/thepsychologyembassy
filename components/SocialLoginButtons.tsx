"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

type Provider = "google" | "azure" | "facebook" | "github";

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
    id: "github",
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#181717">
        <path d="M12 0C5.37 0 0 5.5 0 12.3c0 5.43 3.44 10.04 8.21 11.67.6.11.82-.27.82-.6 0-.29-.01-1.26-.02-2.29-3.34.75-4.04-1.45-4.04-1.45-.55-1.44-1.34-1.82-1.34-1.82-1.09-.77.08-.75.08-.75 1.21.09 1.84 1.28 1.84 1.28 1.07 1.89 2.81 1.34 3.5 1.03.11-.8.42-1.34.76-1.65-2.67-.31-5.47-1.38-5.47-6.15 0-1.36.47-2.47 1.24-3.34-.12-.31-.54-1.57.12-3.28 0 0 1.01-.33 3.3 1.28a11.2 11.2 0 0 1 6.02 0c2.29-1.61 3.3-1.28 3.3-1.28.66 1.71.24 2.97.12 3.28.77.87 1.24 1.98 1.24 3.34 0 4.78-2.81 5.83-5.49 6.14.43.38.81 1.13.81 2.29 0 1.65-.01 2.98-.01 3.39 0 .33.22.72.83.6C20.57 22.33 24 17.72 24 12.3 24 5.5 18.63 0 12 0Z" />
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