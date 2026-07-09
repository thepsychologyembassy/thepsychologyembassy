import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto bg-[#1A1C20] px-6 py-12 text-[#FBF8F2] sm:px-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-10 md:flex-row md:items-start">
        
        {/* Left Side: Logo, Contact & Socials */}
        <div className="flex flex-col items-center md:items-start">
          <Link href="/" className="mb-4 flex flex-col items-center md:items-start">
            <span className="font-serif text-2xl font-medium tracking-wide text-[#88B7B5]">
              Psychology
            </span>
            <span className="text-[0.65rem] uppercase tracking-[0.4em] text-[#88B7B5]">
              Embassy
            </span>
          </Link>

          {/* Email */}
          <a href="mailto:askpsychembassy@gmail.com" className="mb-6 text-sm text-[#FBF8F2]/70 transition-colors hover:text-[#88B7B5]">
            askpsychembassy@gmail.com
          </a>

          {/* Social Links */}
          <div className="mb-6 flex gap-5 text-[#FBF8F2]/60">
            <a href="https://www.instagram.com/psychologyembassy?igsh=ang2NnB0aGM1cGRr" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#FBF8F2]">
              <span className="sr-only">Instagram</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.linkedin.com/company/psychology-embassy/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#FBF8F2]">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>
            </a>
          </div>

          <div className="flex gap-5 text-xs font-semibold uppercase tracking-widest text-[#FBF8F2]/50">
            <Link href="/privacy" className="transition-colors hover:text-[#88B7B5]">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-[#88B7B5]">Terms</Link>
            <Link href="/cookies" className="transition-colors hover:text-[#88B7B5]">Cookies</Link>
          </div>
        </div>

        {/* Right Side: Medical Disclaimer */}
        <div className="max-w-2xl text-center md:text-right">
          <p className="mb-4 text-xs leading-relaxed text-[#FBF8F2]/80">
            <strong className="tracking-widest text-[#88B7B5] uppercase">Disclaimer:</strong> All information provided on this website, including blog posts, videos, resources, and social media content, is <em className="font-medium text-white">for educational and informational purposes only</em>. It is <em className="font-medium text-white">not intended to diagnose, treat, cure, or prevent any mental health condition</em>. Online resources do <em className="font-medium text-white">not replace</em> professional therapy, medical advice, or emergency help.
          </p>
          <p className="text-xs leading-relaxed text-[#FBF8F2]/50">
            If you are experiencing a crisis, please contact a local mental health helpline or emergency services. By engaging with the content or booking services, you acknowledge and accept this disclaimer.
          </p>
        </div>
      </div>

      {/* Bottom Copyright & Developer Credit */}
      <div className="mx-auto mt-16 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-[#FBF8F2]/10 pt-6 text-[10px] uppercase tracking-widest text-[#FBF8F2]/40 md:flex-row">
        <p>© {new Date().getFullYear()} Psychology Embassy. All rights reserved.</p>
        <p className="flex items-center gap-2">
          Site created by{" "}
          <a href="https://www.linkedin.com/in/lakshya8005" target="_blank" rel="noopener noreferrer" className="text-[#88B7B5] transition-colors hover:text-white">
            Lakshya Sharma
          </a>
          <span className="mx-1 opacity-40">|</span>
          <a href="https://github.com/Lava8005" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}