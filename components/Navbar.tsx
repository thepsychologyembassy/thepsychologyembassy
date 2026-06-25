"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll to trigger the frosted glass effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scrolling when the menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [menuOpen]);

  return (
    <>
      {/* 1. TOP NAVBAR */}
      <nav
        className={`pointer-events-auto fixed top-0 left-0 right-0 z-[9990] flex items-center justify-between px-6 py-5 transition-all duration-500 sm:px-12 ${
          scrolled
            ? "bg-[#FBF8F2]/90 backdrop-blur-md border-b border-[#3A3A38]/10 shadow-sm"
            : "bg-transparent"
        }`}
      >
        {/* Left: Hamburger Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(true);
          }}
          className="relative z-[9999] -ml-4 flex cursor-pointer flex-col gap-[5px] p-4 focus:outline-none"
          aria-label="Open Menu"
        >
          <span className={`h-[2px] w-7 transition-colors duration-300 ${scrolled ? 'bg-[#3A3A38]' : 'bg-[#FBF8F2]'}`} />
          <span className={`h-[2px] w-7 transition-colors duration-300 ${scrolled ? 'bg-[#3A3A38]' : 'bg-[#FBF8F2]'}`} />
          <span className={`h-[2px] w-5 transition-colors duration-300 ${scrolled ? 'bg-[#3A3A38]' : 'bg-[#FBF8F2]'}`} />
        </button>

        {/* Center: Logo (Pinned exactly to the center) */}
        <Link href="/" className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <Image 
            src="/logo.png" 
            alt="Psychology Embassy Logo" 
            width={160} 
            height={160} 
            className="h-34 w-auto sm:h-36 object-contain transition-opacity duration-300"
            priority 
          />
        </Link>

        {/* Right: Actions & Authentication */}
        <div className="flex items-center gap-4">
          
          {/* Show Log In when signed out */}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className={`hidden cursor-pointer font-serif text-lg transition-colors duration-300 sm:inline-block ${
                scrolled ? "text-[#3A3A38] hover:text-[#4F6F52]" : "text-[#FBF8F2] hover:text-[#F6D86B]"
              }`}>
                Log In
              </button>
            </SignInButton>
          </Show>

          {/* NEW: Show Dashboard Link and User Profile when signed in */}
          <Show when="signed-in">
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href="/dashboard"
                className={`font-serif text-lg transition-colors duration-300 ${
                  scrolled ? "text-[#3A3A38] hover:text-[#4F6F52]" : "text-[#FBF8F2] hover:text-[#F6D86B]"
                }`}
              >
                My Dashboard
              </Link>
              <UserButton appearance={{ elements: { userButtonAvatarBox: "h-9 w-9" } }} />
            </div>
          </Show>

          <Link
            href="/book"
            className={`hidden rounded-full border px-5 py-2 text-xs uppercase tracking-widest transition-colors duration-300 sm:inline-block ${
              scrolled
                ? "border-[#4F6F52] text-[#4F6F52] hover:bg-[#4F6F52] hover:text-[#FBF8F2]"
                : "border-[#FBF8F2] text-[#FBF8F2] hover:bg-[#FBF8F2] hover:text-[#3A3A38]"
            }`}
          >
            Book Session
          </Link>
        </div>
      </nav>

      {/* 2. FULL-SCREEN OVERLAY MENU */}
      {menuOpen && (
        <div className="pointer-events-auto fixed inset-0 z-[9995] flex flex-col bg-[#1A1C20]/40 px-6 py-8 backdrop-blur-2xl animate-in fade-in duration-300 sm:px-12">
          <div className="flex justify-end">
            <button
              onClick={() => setMenuOpen(false)}
              className="cursor-pointer p-4 text-4xl font-light text-[#FBF8F2] opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-6 sm:gap-8">
            {[
              { name: "Home", path: "/" },
              { name: "Courses & Internships", path: "/courses" },
              { name: "Tests & Tools", path: "/tests" },
              { name: "Blogs", path: "/blogs" },
              { name: "Book Appointment", path: "/book" },
              { name: "About Us", path: "/about" },
            ].map((link, i) => (
              <Link
                key={link.name}
                href={link.path}
                onClick={() => setMenuOpen(false)}
                className="group flex items-center font-serif text-3xl text-[#FBF8F2] transition-colors hover:text-[#CFE3E8] sm:text-5xl"
              >
                <span className="mr-6 font-sans text-sm tracking-widest text-[#4F6F52] opacity-60">
                  0{i + 1}
                </span>
                {link.name}
              </Link>
            ))}
          </div>

          {/* Overlay Footer: Links & Auth */}
          <div className="mt-8 flex flex-col justify-between gap-6 border-t border-[#FBF8F2]/10 pt-6 sm:flex-row">
            
            <div className="flex items-center gap-6 text-sm uppercase tracking-widest text-[#FBF8F2]/60">
              
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="cursor-pointer transition-colors hover:text-[#FBF8F2]">Log In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="cursor-pointer transition-colors hover:text-[#FBF8F2]">Create Account</button>
                </SignUpButton>
              </Show>

              {/* NEW: Add My Dashboard link to Mobile Footer */}
              <Show when="signed-in">
                <div className="flex items-center gap-4">
                  <UserButton />
                  <Link 
                    href="/dashboard" 
                    onClick={() => setMenuOpen(false)}
                    className="cursor-pointer text-[#FBF8F2] transition-colors hover:text-[#88B7B5]"
                  >
                    My Dashboard
                  </Link>
                </div>
              </Show>

            </div>

            <div className="flex gap-4 text-sm uppercase tracking-widest text-[#FBF8F2]/60">
              <a href="#" className="transition-colors hover:text-[#FBF8F2]">IG</a>
              <a href="#" className="transition-colors hover:text-[#FBF8F2]">LI</a>
              <a href="#" className="transition-colors hover:text-[#FBF8F2]">X</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}