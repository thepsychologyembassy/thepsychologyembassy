"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PortableText } from "@portabletext/react";
import Navbar from "../../components/Navbar";
import { client } from "../../lib/sanity";

gsap.registerPlugin(ScrollTrigger);

// We keep your exact pillar colors and rotate through them automatically
const PILLAR_COLORS = [
  { color: "bg-[#D48C70]/10", borderColor: "border-[#D48C70]/30" },
  { color: "bg-[#C9B8A3]/20", borderColor: "border-[#C9B8A3]/40" },
  { color: "bg-[#A65D47]/10", borderColor: "border-[#A65D47]/20" },
];

// This tells Next.js how to style the Sanity text so it perfectly matches your original design
const portableTextStyles: any = {
  block: {
    // Normal paragraphs get your exact styling + the GSAP class
    normal: ({ children }: any) => (
      <p className="story-paragraph mb-6 text-lg leading-relaxed text-[#3A3A38]/80 sm:text-xl sm:leading-loose">
        {children}
      </p>
    ),
    // Use H2 in Sanity for the big opening line
    h2: ({ children }: any) => (
      <p className="story-paragraph mb-8 font-serif text-2xl text-[#3A3A38] sm:text-3xl sm:leading-snug">
        {children}
      </p>
    ),
  },
  marks: {
    em: ({ children }: any) => <em className="italic">{children}</em>,
    // When they click "Bold" in Sanity, it gives it your highlighted Terracotta look
    strong: ({ children }: any) => (
      <strong className="font-medium text-[#A65D47]">{children}</strong>
    ),
  },
};

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Database States
  const [aboutData, setAboutData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch from Sanity
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const data = await client.fetch(`*[_type == "about"][0]`);
        setAboutData(data);
      } catch (error) {
        console.error("Error fetching about data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAboutData();
  }, []);

  // 2. Run GSAP Animations only after data loads
  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return;

    const ctx = gsap.context(() => {
      // Hero Fade
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

      // Story Text Reveal (Targets the dynamic PortableText)
      if (aboutData?.story) {
        gsap.from(".story-paragraph", {
          opacity: 0,
          y: 30,
          stagger: 0.2,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: storyRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        });
      }

      // Pillars Stagger Reveal
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
  }, [isLoading, aboutData]); // Dependency array ensures animations wait for data

  return (
    <main className="relative isolate min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      
      {/* 1. HERO — Desert Dunes Video */}
      <section ref={heroRef} className="relative h-[80vh] w-full overflow-hidden">
        <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none">
          <video
            className="h-full w-full object-cover opacity-90"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/videos/desert-dunes.mp4" type="video/mp4" />
          </video>
          {/* Warm terracotta to sand gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#A65D47]/20 via-[#FBF8F2]/60 to-[#FBF8F2]" />
        </div>

        <div className="hero-text relative z-10 flex h-full flex-col items-center justify-center px-6 pt-20 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.35em] text-[#A65D47] drop-shadow-sm">
            {aboutData?.subtitle || "Our Story"}
          </p>
          <h1 className="max-w-4xl font-serif text-4xl font-medium leading-tight text-[#3A3A38] sm:text-6xl">
            {aboutData?.title || "Resilience in the Vastness."}
          </h1>
        </div>
      </section>

      {/* 2. THE NARRATIVE */}
      <section ref={storyRef} className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-32">
        <div className="flex flex-col gap-8">
          {isLoading ? (
            <p className="animate-pulse text-center text-sm uppercase tracking-widest text-[#A65D47]">Loading Story...</p>
          ) : aboutData?.story ? (
            <PortableText value={aboutData?.story} components={portableTextStyles} />
          ) : (
            <p className="text-center italic text-[#3A3A38]/50">Story content coming soon.</p>
          )}
        </div>
      </section>

      {/* 3. CORE PILLARS */}
      {aboutData?.coreValues && aboutData.coreValues.length > 0 && (
        <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-40">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-medium text-[#3A3A38] sm:text-4xl">
              The Pillars We Build On
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {aboutData.coreValues.map((pillar: any, i: number) => {
              // Rotate through your 3 predefined colors based on the index
              const colorStyle = PILLAR_COLORS[i % PILLAR_COLORS.length];
              
              return (
                <div
                  key={pillar._key || i}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  className={`flex flex-col rounded-3xl border p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${colorStyle.color} ${colorStyle.borderColor}`}
                >
                  <h3 className="mb-4 font-serif text-2xl font-medium text-[#3A3A38]">
                    {pillar.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#3A3A38]/70">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* RENDER NAVBAR LAST */}
      <Navbar />
    </main>
  );
}