"use client";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { client, urlFor } from "../../lib/sanity";

gsap.registerPlugin(ScrollTrigger);

// 1. Styles for the Founder bio (Left aligned, smaller font, original colors)
const founderTextStyles: any = {
  block: {
    normal: ({ children }: any) => (
      <p className="mb-4 text-sm leading-relaxed text-[#3A3A38]/80 font-normal">
        {children}
      </p>
    ),
    h2: ({ children }: any) => (
      <h2 className="mb-6 font-serif text-xl font-medium text-[#2C4C5B]">
        {children}
      </h2>
    ),
  },
  marks: {
    em: ({ children }: any) => <em className="italic">{children}</em>,
    strong: ({ children }: any) => (
      <strong className="font-semibold text-[#A65D47]">{children}</strong>
    ),
  },
};

// 2. Styles for "Where It All Began" (Centered, smaller font, original colors)
const storyTextStyles: any = {
  block: {
    normal: ({ children }: any) => (
      <p className="story-paragraph mb-4 text-sm leading-relaxed text-[#3A3A38]/80 font-normal text-center">
        {children}
      </p>
    ),
    h2: ({ children }: any) => (
      <h2 className="story-paragraph mb-6 font-serif text-xl font-medium text-[#2C4C5B] text-center">
        {children}
      </h2>
    ),
  },
  marks: {
    em: ({ children }: any) => <em className="italic">{children}</em>,
    strong: ({ children }: any) => (
      <strong className="font-semibold text-[#A65D47]">{children}</strong>
    ),
  },
};

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [aboutData, setAboutData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return;
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

      if (aboutData?.story) {
        gsap.from(".story-paragraph", {
          opacity: 0,
          y: 30,
          stagger: 0.15,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: storyRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        });
      }

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.from(card, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          delay: i * 0.1,
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
  }, [isLoading, aboutData]);

  return (
    <main className="relative isolate min-h-screen text-[#3A3A38]">
      {/* GLOBAL BACKGROUND: Desert Video applied to entire page */}
      <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none">
        <video
          className="h-full w-full object-cover opacity-80"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/videos/desert-dunes.mp4" type="video/mp4" />
        </video>
        {/* Soft overlay ensuring sand is visible but text remains readable */}
        <div className="absolute inset-0 bg-[#FBF8F2]/60" />
      </div>

      <Navbar />

      {/* 1. HERO & ISO TAG */}
      <section ref={heroRef} className="relative flex h-[70vh] w-full flex-col items-center justify-center sm:h-[80vh]">
        {/* Left Aligned ISO Certified Link - Single line, no background, unbolded */}
        <div className="absolute left-6 top-32 z-20 sm:left-12">
          <Link href="#" className="text-[10px] font-normal uppercase tracking-widest text-[#3A3A38] transition-colors hover:text-[#A65D47] sm:text-xs">
            ISO Certified Government Registered Organization
          </Link>
        </div>

        <div className="hero-text relative z-10 flex flex-col items-center px-6 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-[#A65D47] drop-shadow-sm">
            {aboutData?.subtitle || "Our Story"}
          </p>
          <h1 className="max-w-4xl font-serif text-4xl font-medium leading-tight text-[#3A3A38] sm:text-5xl md:text-6xl">
            {aboutData?.title || "Resilience in the Vastness."}
          </h1>
        </div>
      </section>

      {/* 2. MEET OUR FOUNDER */}
      {aboutData?.founderName && (
        <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24">
          <div className="flex flex-col items-center gap-10 rounded-3xl border border-[#3A3A38]/5 bg-white/5 p-8 shadow-sm backdrop-blur-md md:flex-row sm:p-12">
            <div className="w-full md:w-1/3">
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl shadow-sm border border-[#3A3A38]/10">
                {aboutData.founderImage ? (
                  <Image
                    src={urlFor(aboutData.founderImage).url()}
                    alt={aboutData.founderName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#2C4C5B]/10 text-[#2C4C5B]">
                    Image Required
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h2 className="mb-2 font-serif text-3xl font-medium text-[#2C4C5B]">Meet Our Founder</h2>
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-[#A65D47]">
                {aboutData.founderName}
              </h3>
              <div className="prose prose-sm max-w-none text-[#3A3A38]">
                {aboutData.founderBio ? (
                  <PortableText value={aboutData.founderBio} components={founderTextStyles} />
                ) : (
                  <p className="text-sm text-[#3A3A38]/70">Bio coming soon.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. WHERE IT ALL BEGAN */}
      <section ref={storyRef} className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[#3A3A38]/5 bg-white/5 p-8 shadow-sm backdrop-blur-md sm:p-12">
          <h2 className="mb-4 font-serif text-3xl font-medium text-[#2C4C5B]">Where It All Began</h2>
          {isLoading ? (
            <p className="animate-pulse text-xs font-semibold uppercase tracking-widest text-[#A65D47]">Loading Story...</p>
          ) : aboutData?.story ? (
            <div className="max-w-2xl">
              <PortableText value={aboutData?.story} components={storyTextStyles} />
            </div>
          ) : (
            <p className="italic text-sm text-[#3A3A38]/50">Story content coming soon.</p>
          )}
        </div>
      </section>

      {/* 4. MISSION & VISION */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center text-center rounded-3xl border border-[#3A3A38]/5 bg-white/5 p-8 shadow-sm backdrop-blur-md transition-transform hover:-translate-y-1">
            <h3 className="mb-3 font-serif text-2xl font-medium text-[#2C4C5B]">Our Mission</h3>
            <p className="text-sm font-normal leading-relaxed text-[#3A3A38]/80">
              {aboutData?.mission || "Mission statement coming soon."}
            </p>
          </div>
          <div className="flex flex-col items-center text-center rounded-3xl border border-[#3A3A38]/5 bg-white/5 p-8 shadow-sm backdrop-blur-md transition-transform hover:-translate-y-1">
            <h3 className="mb-3 font-serif text-2xl font-medium text-[#2C4C5B]">Our Vision</h3>
            <p className="text-sm font-normal leading-relaxed text-[#3A3A38]/80">
              {aboutData?.vision || "Vision statement coming soon."}
            </p>
          </div>
        </div>
      </section>

      {/* 5. FOUNDING PILLARS */}
      {aboutData?.coreValues && aboutData.coreValues.length > 0 && (
        <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-40">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-medium text-[#3A3A38]">
              Founding Pillars
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {aboutData.coreValues.map((pillar: any, i: number) => (
              <div
                key={pillar._key || i}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="flex flex-col items-center text-center rounded-3xl border border-[#3A3A38]/5 bg-white/5 p-8 shadow-sm backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:bg-white/10"
              >
                <h3 className="mb-3 font-serif text-lg font-semibold text-[#3A3A38]">
                  {pillar.title}
                </h3>
                <p className="text-sm font-normal leading-relaxed text-[#3A3A38]/80">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}