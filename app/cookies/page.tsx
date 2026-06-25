import Link from "next/link";
import Navbar from "../../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Psychology Embassy",
  description: "How Psychology Embassy uses cookies and tracking technologies.",
};

export default function CookiesPage() {
  const lastUpdated = "June 2026";

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 pb-32 pt-32">
        <div className="mb-12 border-b border-[#3A3A38]/10 pb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#88B7B5]">Legal</p>
          <h1 className="font-serif text-4xl font-medium text-[#2C4C5B]">Cookie Policy</h1>
          <p className="mt-3 text-sm text-[#3A3A38]/60">Last updated: {lastUpdated}</p>
        </div>

        <div className="flex flex-col gap-10 text-sm leading-relaxed text-[#3A3A38]/80">

          <p>
            This Cookie Policy explains what cookies are, which ones Psychology Embassy uses, and how you can control them. By using our website, you consent to the use of cookies as described here.
          </p>

          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device by a website. They help the website remember information about your visit — like whether you're logged in — to make your next visit easier and the site more useful to you.
            </p>
          </div>

          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">Cookies We Use</h2>

            <div className="flex flex-col gap-6">
              {/* Necessary */}
              <div className="rounded-2xl border border-[#4F6F52]/20 bg-[#4F6F52]/5 p-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-[#4F6F52] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Always On</span>
                  <h3 className="font-serif text-lg font-medium text-[#2C4C5B]">Strictly Necessary</h3>
                </div>
                <p className="mb-3">These cookies are essential for the website to function. They cannot be disabled.</p>
                <ul className="flex flex-col gap-2 pl-4 text-xs">
                  <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#4F6F52]">•</span><strong>Authentication cookies</strong> (Supabase, Clerk) — Keep you logged in during your session.</li>
                  <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#4F6F52]">•</span><strong>Cookie consent</strong> — Remembers that you have accepted this cookie notice (stored in localStorage).</li>
                </ul>
              </div>

              {/* Analytics */}
              <div className="rounded-2xl border border-[#88B7B5]/20 bg-[#88B7B5]/5 p-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-[#88B7B5] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Optional</span>
                  <h3 className="font-serif text-lg font-medium text-[#2C4C5B]">Analytics</h3>
                </div>
                <p className="mb-3">These cookies help us understand how visitors use the website so we can improve it. All data is anonymised — it cannot identify you personally.</p>
                <ul className="flex flex-col gap-2 pl-4 text-xs">
                  <li className="flex gap-3"><span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span><strong>Google Analytics 4</strong> (_ga, _gid) — Tracks page views, session duration, and general traffic patterns. Set by Google. You can opt out via <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-[#4F6F52] underline">Google's opt-out tool</a>.</li>
                </ul>
              </div>

              {/* Third party */}
              <div className="rounded-2xl border border-[#3A3A38]/10 bg-white p-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-[#3A3A38]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Third Party</span>
                  <h3 className="font-serif text-lg font-medium text-[#2C4C5B]">Payment Processing</h3>
                </div>
                <p className="mb-3">When you make a payment, Razorpay may set its own cookies to operate the secure checkout. These are governed by <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-[#4F6F52] underline">Razorpay's Privacy Policy</a>.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">How to Control Cookies</h2>
            <p className="mb-3">You can control and delete cookies through your browser settings. Here are direct links for common browsers:</p>
            <ul className="flex flex-col gap-2 pl-4">
              {[
                { name: "Google Chrome", url: "https://support.google.com/chrome/answer/95647" },
                { name: "Mozilla Firefox", url: "https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" },
                { name: "Apple Safari", url: "https://support.apple.com/en-gb/guide/safari/sfri11471/mac" },
                { name: "Microsoft Edge", url: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
              ].map((b) => (
                <li key={b.name} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-[#88B7B5]">•</span>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-[#4F6F52] underline underline-offset-2 hover:text-[#3A533D]">{b.name}</a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[#3A3A38]/60">Note: Disabling strictly necessary cookies will prevent you from logging in and booking sessions.</p>
          </div>

          <div>
            <h2 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">Contact</h2>
            <p>For questions about cookies or this policy, email <a href="mailto:thepsychologyembassy@gmail.com" className="text-[#4F6F52] underline underline-offset-2">thepsychologyembassy@gmail.com</a>.</p>
          </div>

          <div className="flex gap-6 border-t border-[#3A3A38]/10 pt-8 text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/50">
            <Link href="/privacy" className="transition-colors hover:text-[#4F6F52]">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-[#4F6F52]">Terms of Service</Link>
            <Link href="/" className="transition-colors hover:text-[#4F6F52]">← Home</Link>
          </div>

        </div>
      </section>
    </main>
  );
}