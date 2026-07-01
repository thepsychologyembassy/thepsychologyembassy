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
  // Automatically force dark text/borders on these specific light-background routes
  const forceSolid = ["/dashboard", "/counselor-portal", "/login", "/signup", "/tools"].includes(pathname);
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
                {isCounselor ? "Doctor Portal" : "My Dashboard"}
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

          <div className="mt-8 flex flex-col justify-between gap-6 border-t border-[#FBF8F2]/10 pt-6 sm:flex-row">
            <div className="flex items-center gap-6 text-sm uppercase tracking-widest text-[#FBF8F2]/60">
              {!user ? (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="transition-colors hover:text-[#FBF8F2]">Log In</Link>
                  <Link href="/signup" onClick={() => setMenuOpen(false)} className="transition-colors hover:text-[#FBF8F2]">Create Account</Link>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href={isCounselor ? "/counselor-portal" : "/dashboard"} onClick={() => setMenuOpen(false)} className="text-[#FBF8F2] hover:text-[#88B7B5]">
                    {isCounselor ? "Doctor Portal" : "My Dashboard"}
                  </Link>
                  <button onClick={handleLogout} className="text-[#A65D47] hover:text-red-400">Log Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}