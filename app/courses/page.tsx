"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../../components/Navbar";
import { client, urlFor } from "../../lib/sanity";

gsap.registerPlugin(ScrollTrigger);

interface Course {
  _id: string;
  title: string;
  slug: { current: string };
  type: string;
  description: string;
  duration: string;
  provider: string;
  externalLink?: string;
  image?: any;
  isComingSoon?: boolean; // NEW FIELD
}

export default function CoursesPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | HTMLAnchorElement | null)[]>([]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await client.fetch(
          `*[_type in ["course", "internship"]] | order(orderRank)`
        );
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ctx = gsap.context(() => {
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

  useEffect(() => {
    if (courses.length === 0) return;
    const ctx = gsap.context(() => {
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
    <main className="relative bg-[#1A1C20] text-[#FBF8F2]">
      <Navbar />

      <section
        ref={heroRef}
        className="relative h-[100vh] w-full overflow-hidden bg-[#1A1C20]"
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/videos/mountain-climb.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1C20]/40 via-[#1A1C20]/20 to-[#1A1C20]" />

        <div className="hero-text relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-[#CFE3E8] drop-shadow-sm">
            Ascend Your Career
          </p>
          <h1 className="max-w-4xl font-serif text-4xl font-medium leading-tight text-[#FBF8F2] drop-shadow-[0_2px_18px_rgba(207,227,232,0.3)] sm:text-6xl">
            Courses & Internship Opportunities
          </h1>
        </div>
      </section>

      <section className="relative z-10 mx-auto min-h-screen w-full max-w-6xl px-6 pt-20 pb-40">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-3xl font-medium text-[#FBF8F2] sm:text-4xl">
            The Climb Starts Here
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#CFE3E8]/80 leading-relaxed">
            Bridge the gap between theory and practice. Our curated programs are
            designed to push your boundaries and prepare you for real-world impact.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <p className="animate-pulse text-sm uppercase tracking-widest text-[#CFE3E8]">
              Loading Opportunities...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((opp, i) => {
              const isComingSoon = opp.isComingSoon === true;

              // Clean JSX variable instead of a functional component
              const cardContent = (
                <>
                  <div className="relative h-44 w-full overflow-hidden shrink-0">
                    {opp.image ? (
                      <Image
                        src={urlFor(opp.image).width(600).height(352).fit("crop").url()}
                        alt={opp.title}
                        fill
                        className={`object-cover ${isComingSoon ? "grayscale opacity-80" : "transition-transform duration-500 group-hover:scale-105"}`}
                      />
                    ) : (
                      <div className="h-2 w-full bg-gradient-to-r from-[#CFE3E8]/20 via-[#4F6F52]/30 to-[#CFE3E8]/20" />
                    )}
                    <div className="absolute inset-0 bg-[#1A1C20]/20" />
                    
                    {/* COMING SOON BADGE */}
                    {isComingSoon && (
                      <div className="absolute top-4 right-4 z-20 rounded-full bg-[#1A1C20]/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#F6D86B] border border-[#F6D86B]/30 shadow-lg">
                        Coming Soon
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-8">
                    {/* HIDE TAGS IF COMING SOON */}
                    {!isComingSoon && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className="inline-block rounded-full bg-[#CFE3E8]/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-[#CFE3E8] border border-[#CFE3E8]/20">
                          {opp.type || "Program"}
                        </span>
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider border ${
                            opp.provider === "External"
                              ? "bg-transparent text-[#CFE3E8]/60 border-[#CFE3E8]/30 border-dashed"
                              : "bg-[#4F6F52]/30 text-[#A3C4C3] border-[#4F6F52]/40"
                          }`}
                        >
                          {opp.provider || "Internal"}
                        </span>
                      </div>
                    )}

                    <h3 className={`font-serif text-2xl font-medium ${isComingSoon ? "text-[#FBF8F2]/70 mt-2 mb-0" : "text-[#FBF8F2] mb-3"}`}>
                      {opp.title}
                    </h3>
                    
                    {/* HIDE DESCRIPTION IF COMING SOON */}
                    {!isComingSoon && (
                      <p className="mb-6 flex-grow text-sm leading-relaxed text-[#FBF8F2]/70">
                        {opp.description}
                      </p>
                    )}

                    <div className={`mt-auto flex items-center justify-between border-t border-[#CFE3E8]/10 pt-4 ${isComingSoon ? "mt-8" : ""}`}>
                      <span className="text-xs font-medium text-[#CFE3E8]/60 uppercase tracking-widest">
                        {isComingSoon ? "Status" : (opp.duration || "Self-Paced")}
                      </span>
                      <span className={`text-sm font-medium flex items-center gap-2 ${isComingSoon ? "text-[#CFE3E8]/40" : "text-[#CFE3E8] transition-colors group-hover:text-white"}`}>
                        {isComingSoon ? "In Development" : "Apply Now"}
                        {!isComingSoon && (
                          <span className="transform transition-transform group-hover:translate-x-1">→</span>
                        )}
                      </span>
                    </div>
                  </div>
                </>
              );

              // 🔴 BULLETPROOF FIX: Renders as a pure <div>. Cannot be clicked!
              if (isComingSoon) {
                return (
                  <div
                    key={opp._id}
                    ref={(el) => { cardsRef.current[i] = el as any; }}
                    className="group flex flex-col rounded-2xl border border-[#CFE3E8]/10 bg-[#1A1C20]/60 backdrop-blur-md overflow-hidden opacity-60 select-none"
                  >
                    {cardContent}
                  </div>
                );
              }

              // 🟢 Normal state: Renders as an active <Link>
              return (
                <Link
                  key={opp._id}
                  href={opp.provider === "External" && opp.externalLink ? opp.externalLink : `/courses/${opp.slug?.current || ""}`}
                  target={opp.provider === "External" ? "_blank" : "_self"}
                  rel={opp.provider === "External" ? "noopener noreferrer" : ""}
                  ref={(el) => { cardsRef.current[i] = el as any; }}
                  className="group flex flex-col rounded-2xl border border-[#CFE3E8]/10 bg-[#1A1C20]/60 backdrop-blur-md overflow-hidden transition-all hover:bg-[#1A1C20]/80 hover:border-[#CFE3E8]/30"
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}