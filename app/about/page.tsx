"use client";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import { client, urlFor } from "../../lib/sanity";

gsap.registerPlugin(ScrollTrigger);

// 1. Styles for the Founder bio (Dark Onyx text, highlighted terracotta)
const founderTextStyles: any = {
  block: {
    normal: ({ children }: any) => (
      <p className="mb-4 text-sm font-normal leading-relaxed text-[#171717]">
        {children}
      </p>
    ),
    h2: ({ children }: any) => (
      <h2 className="mb-6 font-serif text-xl font-medium text-[#171717]">
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

// 2. Styles for "Where It All Began" (Centered, Dark Onyx text, highlighted terracotta)
const storyTextStyles: any = {
  block: {
    normal: ({ children }: any) => (
      <p className="story-paragraph mb-4 text-center text-sm font-normal leading-relaxed text-[#171717]">
        {children}
      </p>
    ),
    h2: ({ children }: any) => (
      <h2 className="story-paragraph mb-6 text-center font-serif text-xl font-medium text-[#171717]">
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
    <main className="relative isolate min-h-screen text-[#171717]">
      {/* GLOBAL BACKGROUND: Desert Video applied to entire page - 100% CLEAR */}
      <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/videos/desert-dunes.mp4" type="video/mp4" />
        </video>
      </div>

      <Navbar />

      {/* 1. HERO: LOGO & ISO TAG */}
      <section ref={heroRef} className="relative flex min-h-[50vh] w-full flex-col items-center justify-center pt-32 pb-12 sm:pt-40">
        <div className="hero-text px-6 flex flex-col items-center text-center">
          <Image 
            src="/logo.png" 
            alt="Psychology Embassy Logo" 
            width={160} 
            height={160} 
            className="mb-8 object-contain drop-shadow-sm" 
            priority 
          />
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-[#171717] drop-shadow-sm leading-loose">
            Government Registered<br />
            ISO certified<br />
            organization
          </p>
        </div>
      </section>

      {/* 2. MISSION & VISION (Moved Up) */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center rounded-3xl border border-[#171717]/10 bg-white/5 p-8 text-center shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-1">
            <h3 className="mb-3 font-serif text-3xl font-medium text-[#171717]">Our Mission</h3>
            <p className="text-sm font-normal leading-relaxed text-[#171717]/90">
              {aboutData?.mission || "Mission statement coming soon."}
            </p>
          </div>
          <div className="flex flex-col items-center rounded-3xl border border-[#171717]/10 bg-white/5 p-8 text-center shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-1">
            <h3 className="mb-3 font-serif text-3xl font-medium text-[#171717]">Our Vision</h3>
            <p className="text-sm font-normal leading-relaxed text-[#171717]/90">
              {aboutData?.vision || "Vision statement coming soon."}
            </p>
          </div>
        </div>
      </section>

      {/* 3. MEET OUR FOUNDER */}
      {aboutData?.founderName && (
        <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24">
          <h2 className="mb-10 text-center font-serif text-3xl font-medium text-[#171717] sm:text-4xl">
            Meet Our Founder
          </h2>
          {/* Changed items-center to items-start to top-align the content */}
          <div className="flex flex-col items-start gap-10 rounded-3xl border border-[#171717]/10 bg-white/5 p-8 shadow-sm backdrop-blur-sm md:flex-row sm:p-12">
            <div className="w-full md:w-1/3">
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-[#171717]/10 shadow-sm">
                {aboutData.founderImage ? (
                  <Image
                    src={urlFor(aboutData.founderImage).url()}
                    alt={aboutData.founderName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#171717]/5 text-[#171717]/50">
                    Image Required
                  </div>
                )}
              </div>
            </div>
            {/* Added text-left to strictly keep text on the top left */}
            <div className="w-full md:w-2/3 flex flex-col items-start text-left">
              <h3 className="mb-6 font-serif text-2xl font-medium text-[#171717] sm:text-3xl">
                {aboutData.founderName}
              </h3>
              <div className="prose prose-sm max-w-none text-[#171717] text-left">
                {aboutData.founderBio ? (
                  <PortableText value={aboutData.founderBio} components={founderTextStyles} />
                ) : (
                  <p className="text-sm font-normal text-[#171717]/70">Bio coming soon.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. OUR STORY / RESILIENCE */}
      <section className="relative z-10 flex w-full flex-col items-center px-6 pb-12 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-[#A65D47] drop-shadow-sm">
          {aboutData?.subtitle || "Our Story"}
        </p>
        <h2 className="max-w-4xl font-serif text-3xl font-medium leading-tight text-[#171717] sm:text-4xl">
          {aboutData?.title || "Resilience in the Vastness."}
        </h2>
      </section>

      {/* 5. WHERE IT ALL BEGAN */}
      <section ref={storyRef} className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[#171717]/10 bg-white/5 p-8 shadow-sm backdrop-blur-sm sm:p-12">
          {/* Sized down by 1 point to sit under the main Story heading nicely */}
          <h3 className="mb-4 font-serif text-2xl font-medium text-[#171717] sm:text-3xl">
            Where It All Began
          </h3>
          {isLoading ? (
            <p className="animate-pulse text-xs font-semibold uppercase tracking-widest text-[#A65D47]">Loading Story...</p>
          ) : aboutData?.story ? (
            <div className="max-w-2xl">
              <PortableText value={aboutData?.story} components={storyTextStyles} />
            </div>
          ) : (
            <p className="italic text-sm text-[#171717]/50">Story content coming soon.</p>
          )}
        </div>
      </section>

      {/* 6. FOUNDING PILLARS */}
      {aboutData?.coreValues && aboutData.coreValues.length > 0 && (
        <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-40">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-medium text-[#171717] sm:text-4xl">
              Founding Pillars
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {aboutData.coreValues.map((pillar: any, i: number) => (
              <div
                key={pillar._key || i}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="flex flex-col items-center rounded-3xl border border-[#171717]/10 bg-white/5 p-8 text-center shadow-sm backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/10"
              >
                <h3 className="mb-3 font-serif text-xl font-medium text-[#171717]">
                  {pillar.title}
                </h3>
                <p className="text-sm font-normal leading-relaxed text-[#171717]/90">
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