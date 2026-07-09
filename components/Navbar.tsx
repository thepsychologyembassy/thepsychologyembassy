"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { client } from "../lib/sanity";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCounselor, setIsCounselor] = useState(false);
  
  const pathname = usePathname();
  const forceSolid = ["/dashboard", "/counselor-portal", "/login", "/signup", "/tools", "/counselors"].some(path => pathname.startsWith(path));
  const isSolid = scrolled || forceSolid;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      if (footer) (footer as HTMLElement).style.visibility = "hidden";
    } else {
      document.body.style.overflow = "unset";
      if (footer) (footer as HTMLElement).style.visibility = "visible";
   }
  }, [menuOpen]);

  useEffect(() => {
    const checkRole = async (sessionUser: any) => {
      if (sessionUser?.email) {
        const sanityCounselor = await client.fetch(
          `*[_type == "counselor" && email == $email][0]`,
          { email: sessionUser.email.toLowerCase().trim() },
          { cache: "no-store" }
        );
        setIsCounselor(!!sanityCounselor);
      } else {
        setIsCounselor(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      checkRole(session?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      checkRole(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <>
      <nav
        className={`pointer-events-auto fixed top-0 left-0 right-0 z-[9990] flex items-center justify-between px-6 py-5 transition-all duration-500 sm:px-12 ${
          scrolled ? "bg-[#FBF8F2]/90 backdrop-blur-md border-b border-[#3A3A38]/10 shadow-sm" : "bg-transparent"
        }`}
      >
        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }} className="relative z-[9999] -ml-4 flex cursor-pointer flex-col gap-[5px] p-4 focus:outline-none">
          <span className={`h-[2px] w-7 transition-colors duration-300 ${isSolid ? 'bg-[#3A3A38]' : 'bg-[#FBF8F2]'}`} />
          <span className={`h-[2px] w-7 transition-colors duration-300 ${isSolid ? 'bg-[#3A3A38]' : 'bg-[#FBF8F2]'}`} />
          <span className={`h-[2px] w-5 transition-colors duration-300 ${isSolid ? 'bg-[#3A3A38]' : 'bg-[#FBF8F2]'}`} />
        </button>

        <Link href="/" className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <Image src="/logo.png" alt="Psychology Embassy Logo" width={160} height={160} className="h-34 w-auto sm:h-36 object-contain transition-opacity duration-300" priority />
        </Link>

        <div className="flex items-center gap-4">
          {!user ? (
            <Link href="/login" className={`hidden cursor-pointer font-serif text-lg transition-colors duration-300 sm:inline-block ${
              isSolid ? "text-[#3A3A38] hover:text-[#4F6F52]" : "text-[#FBF8F2] hover:text-[#F6D86B]"
            }`}>
              Log In
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-6">
              <Link href={isCounselor ? "/counselor-portal" : "/dashboard"} className={`font-serif text-lg transition-colors duration-300 ${
                isSolid ? "text-[#3A3A38] hover:text-[#4F6F52]" : "text-[#FBF8F2] hover:text-[#F6D86B]"
              }`}>
                {isCounselor ? "Professional Portal" : "My Dashboard"}
              </Link>
              <button onClick={handleLogout} className={`text-sm font-medium transition-colors ${
                isSolid ? "text-[#A65D47] hover:text-red-700" : "text-red-300 hover:text-white"
              }`}>
                Log Out
              </button>
            </div>
          )}

          <Link href="/book" className={`hidden rounded-full border px-5 py-2 text-xs uppercase tracking-widest transition-colors duration-300 sm:inline-block ${
              isSolid ? "border-[#4F6F52] text-[#4F6F52] hover:bg-[#4F6F52] hover:text-[#FBF8F2]" : "border-[#FBF8F2] text-[#FBF8F2] hover:bg-[#FBF8F2] hover:text-[#3A3A38]"
            }`}>
            Book Session
          </Link>
        </div>
      </nav>

      {menuOpen && (
        <div className="pointer-events-auto fixed inset-0 z-[99999] flex flex-col bg-[#1A1C20]/40 px-6 py-8 backdrop-blur-2xl animate-in fade-in duration-300 sm:px-12">
          <div className="flex justify-end">
            <button onClick={() => setMenuOpen(false)} className="cursor-pointer p-4 text-4xl font-light text-[#FBF8F2] opacity-70 transition-opacity hover:opacity-100">✕</button>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-6 sm:gap-8">
            {[
              { name: "Home", path: "/" },
              { name: "Courses & Internships", path: "/programs" },
              { name: "Tests & Tools", path: "/tools" },
              { name: "Blogs", path: "/blogs" },
              { name: "Events & Initiatives", path: "/events" },
              { name: "Book Appointment", path: "/book" },
              { name: "About Us", path: "/about" },
            ].map((link, i) => (
              <Link key={link.name} href={link.path} onClick={() => setMenuOpen(false)} className="group flex items-center font-serif text-3xl text-[#FBF8F2] transition-colors hover:text-[#CFE3E8] sm:text-5xl">
                <span className="mr-6 font-sans text-sm tracking-widest text-[#4F6F52] opacity-60">0{i + 1}</span>
                {link.name}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col justify-between gap-6 border-t border-[#FBF8F2]/10 pt-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-6 text-sm uppercase tracking-widest text-[#FBF8F2]/60">
              {!user ? (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="transition-colors hover:text-[#FBF8F2]">Log In</Link>
                  <Link href="/signup" onClick={() => setMenuOpen(false)} className="transition-colors hover:text-[#FBF8F2]">Create Account</Link>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href={isCounselor ? "/counselor-portal" : "/dashboard"} onClick={() => setMenuOpen(false)} className="text-[#FBF8F2] hover:text-[#88B7B5]">
                    {isCounselor ? "Professional Portal" : "My Dashboard"}
                  </Link>
                  <button onClick={handleLogout} className="text-[#A65D47] hover:text-red-400">Log Out</button>
                </div>
              )}
            </div>

            {/* Mobile Social Links */}
            <div className="flex items-center gap-5 text-[#FBF8F2]/60">
              <a href="https://www.instagram.com/psychologyembassy?igsh=ang2NnB0aGM1cGRr" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#FBF8F2]">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/psychology-embassy/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#FBF8F2]">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}