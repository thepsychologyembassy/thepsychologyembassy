"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../../components/Navbar";
import { client } from "../../lib/sanity";

gsap.registerPlugin(ScrollTrigger);

// Define the shape of the Sanity data based on your UI needs
interface Course {
  _id: string;
  title: string;
  slug: { current: string };
  type: string; // e.g., 'Internship' or 'Course'
  description: string;
  duration: string;
  provider: string;
  externalLink?: string;
}

export default function CoursesPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  // Updated to HTMLAnchorElement since we are using <Link> now
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  
  // Database States
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch from Sanity on Page Load
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await client.fetch(`*[_type == "course"]`);
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // 2. Animate the Hero Section (Runs immediately)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ctx = gsap.context(() => {
      // Fade out hero text on scroll
      gsap.to(".hero-text", {
        opacity: 0,
        y: -40,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  // 3. Animate the Cards (Runs ONLY after courses are loaded)
  useEffect(() => {
    if (courses.length === 0) return;
    const ctx = gsap.context(() => {
      // Staggered reveal for the opportunity cards
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.from(card, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          delay: i * 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });
    });
    return () => ctx.revert();
  }, [courses]);

  return (
    <main className="relative text-[#FBF8F2]">
      <Navbar />

      {/* 1. HERO — Mountain Video Background */}
      <section ref={heroRef} className="relative h-[100vh] w-full overflow-hidden">
        <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none">
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/videos/mountain-climb.mp4" type="video/mp4" />
          </video>
          {/* Cool, icy overlay for the mountain theme */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1C20]/40 via-[#1A1C20]/20 to-[#1A1C20]" />
        </div>

        <div className="hero-text relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-[#CFE3E8] drop-shadow-sm">
            Ascend Your Career
          </p>
          <h1
            className="max-w-4xl font-serif text-4xl font-medium leading-tight text-[#FBF8F2] drop-shadow-[0_2px_18px_rgba(207,227,232,0.3)] sm:text-6xl"
          >
            Courses & Internship Opportunities
          </h1>
        </div>
      </section>

      {/* 2. THE CONTENT GRID */}
      <section className="relative z-10 mx-auto min-h-screen w-full max-w-6xl px-6 pt-20 pb-40">
        
        {/* Subtle glass wash to ensure readability over the dark background */}
        <div className="mb-16 text-center">
          <h2 className="font-serif text-3xl font-medium text-[#FBF8F2] sm:text-4xl">
            The Climb Starts Here
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#CFE3E8]/80 leading-relaxed">
            Bridge the gap between theory and practice. Our curated programs are designed to push your boundaries and prepare you for real-world impact.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <p className="animate-pulse text-sm uppercase tracking-widest text-[#CFE3E8]">Loading Opportunities...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((opp, i) => (
              <Link
                href={opp.provider === "External" && opp.externalLink ? opp.externalLink : `/courses/${opp.slug?.current || ""}`}
                target={opp.provider === "External" ? "_blank" : "_self"}
                rel={opp.provider === "External" ? "noopener noreferrer" : ""}
                key={opp._id}
                ref={(el) => { cardsRef.current[i] = el as any; }}
                className="group flex flex-col rounded-2xl border border-[#CFE3E8]/10 bg-[#1A1C20]/60 p-8 backdrop-blur-md transition-all hover:bg-[#1A1C20]/80 hover:border-[#CFE3E8]/30"
              >
                <div className="mb-4 flex flex-wrap gap-2">
                  {/* Badge 1: Internship / Course */}
                  <span className="inline-block rounded-full bg-[#CFE3E8]/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-[#CFE3E8] border border-[#CFE3E8]/20">
                    {opp.type || "Program"}
                  </span>
                  
                  {/* Badge 2: Internal / External */}
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider border ${
                    opp.provider === "External" 
                      ? "bg-transparent text-[#CFE3E8]/60 border-[#CFE3E8]/30 border-dashed" // A cool dashed border for external links
                      : "bg-[#4F6F52]/30 text-[#A3C4C3] border-[#4F6F52]/40" // A rich green tint for internal programs
                  }`}>
                    {opp.provider || "Internal"}
                  </span>
                </div>
                <h3 className="mb-3 font-serif text-2xl font-medium text-[#FBF8F2]">
                  {opp.title}
                </h3>
                <p className="mb-6 flex-grow text-sm leading-relaxed text-[#FBF8F2]/70">
                  {opp.description}
                </p>
                
                <div className="mt-auto flex items-center justify-between border-t border-[#CFE3E8]/10 pt-4">
                  <span className="text-xs font-medium text-[#CFE3E8]/60 uppercase tracking-widest">
                    {opp.duration || "Self-Paced"}
                  </span>
                  <span className="text-sm font-medium text-[#CFE3E8] transition-colors group-hover:text-white flex items-center gap-2">
                    Apply Now 
                    <span className="transform transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}