import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-50 mt-auto border-t border-[#FBF8F2]/10 bg-[#1A1C20] px-6 py-12 text-[#FBF8F2] backdrop-blur-xl sm:px-12">
      {/* Dark opaque glass with a subtle blur, completely transforming the aesthetic */}
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-10 md:flex-row md:items-start">
        
        {/* Left Side: Logo & Copyright */}
        <div className="flex flex-col items-center md:items-start">
          <Link href="/" className="mb-4 flex flex-col items-center md:items-start">
            <span className="font-serif text-xl font-medium tracking-wide text-[#FBF8F2]">
              Psychology
            </span>
            <span className="text-[0.55rem] uppercase tracking-[0.4em] text-[#88B7B5]">
              Embassy
            </span>
          </Link>
          <p className="text-xs tracking-widest text-[#FBF8F2]/50 uppercase">
            © {new Date().getFullYear()} Psychology Embassy.
          </p>
          <div className="mt-5 flex gap-5 text-xs font-semibold uppercase tracking-widest text-[#FBF8F2]/80">
            <Link href="/privacy" className="transition-colors hover:text-[#88B7B5]">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-[#88B7B5]">Terms</Link>
            <Link href="/cookies" className="transition-colors hover:text-[#88B7B5]">Cookies</Link>
          </div>
        </div>

        {/* Right Side: Medical Disclaimer (High Visibility) */}
        <div className="max-w-2xl text-center md:text-right">
          <p className="mb-4 text-xs leading-relaxed text-[#FBF8F2]/90">
            <strong className="text-[#88B7B5] tracking-widest uppercase">Medical Disclaimer:</strong> All information provided on this website, including blog posts, videos, resources, and social media content, is <em className="text-white font-medium">for educational and informational purposes only</em>. It is <em className="text-white font-medium">not intended to diagnose, treat, cure, or prevent any mental health condition</em>. Online resources do <em className="text-white font-medium">not replace</em> professional therapy, medical advice, or emergency help.
          </p>
          <p className="text-xs leading-relaxed text-[#FBF8F2]/60">
            If you are experiencing a crisis, please contact a local mental health helpline or emergency services. By engaging with the content or booking services, you acknowledge and accept this disclaimer.
          </p>
        </div>

      </div>
    </footer>
  );
}