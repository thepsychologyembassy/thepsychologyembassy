"use client";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import { client, urlFor } from "../../lib/sanity";

gsap.registerPlugin(ScrollTrigger);

// 1. Styles for the Founder bio (Left aligned, smaller font, black)
const founderTextStyles: any = {
  block: {
    normal: ({ children }: any) => (
      <p className="mb-4 text-sm leading-relaxed text-black">
        {children}
      </p>
    ),
    h2: ({ children }: any) => (
      <p className="mb-6 font-serif text-xl font-bold text-black">
        {children}
      </p>
    ),
  },
  marks: {
    em: ({ children }: any) => <em className="italic">{children}</em>,
    strong: ({ children }: any) => (
      <strong className="font-bold text-[#A65D47]">{children}</strong>
    ),
  },
};

// 2. Styles for "Where It All Began" (Centered, smaller font, black, keeps GSAP class)
const storyTextStyles: any = {
  block: {
    normal: ({ children }: any) => (
      <p className="story-paragraph mb-4 text-sm leading-relaxed text-black text-center">
        {children}
      </p>
    ),
    h2: ({ children }: any) => (
      <p className="story-paragraph mb-6 font-serif text-xl font-bold text-black text-center">
        {children}
      </p>
    ),
  },
  marks: {
    em: ({ children }: any) => <em className="italic">{children}</em>,
    strong: ({ children }: any) => (
      <strong className="font-bold text-[#A65D47]">{children}</strong>
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
          className="h-full w-full object-cover opacity-90"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/videos/desert-dunes.mp4" type="video/mp4" />
        </video>
        {/* Soft overlay ensuring sand is visible but text remains readable */}
        <div className="absolute inset-0 bg-[#FBF8F2]/30" />
      </div>

      <Navbar />

      {/* 1. HERO & ISO TAG */}
      <section ref={heroRef} className="relative flex h-[70vh] w-full flex-col items-center justify-center sm:h-[80vh]">
        {/* Left Aligned ISO Certified Badge - Now much smaller and glassmorphism */}
        <div className="absolute left-6 top-32 z-20 sm:left-12">
          <div className="max-w-50 rounded-xl border border-white/20 bg-white/10 p-3 shadow-sm backdrop-blur-md">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-black sm:text-xs">
              ISO Certified
              <br />
              <span className="text-[#A65D47]">Government Registered Organization</span>
            </h2>
          </div>
        </div>

        <div className="hero-text relative z-10 flex flex-col items-center px-6 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-black drop-shadow-sm">
            {aboutData?.subtitle || "Our Story"}
          </p>
          {/* Main heading size matches the rest of your app (text-4xl to text-6xl) */}
          <h1 className="max-w-4xl font-serif text-4xl font-medium leading-tight text-black sm:text-5xl md:text-6xl">
            {aboutData?.title || "Resilience in the Vastness."}
          </h1>
        </div>
      </section>

      {/* 2. MEET OUR FOUNDER (Frosted Grid) */}
      {aboutData?.founderName && (
        <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24">
          <div className="flex flex-col items-center gap-10 rounded-3xl border border-white/20 bg-white/10 p-8 shadow-sm backdrop-blur-xl md:flex-row sm:p-12">
            <div className="w-full md:w-1/3">
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl shadow-md border border-white/20">
                {aboutData.founderImage ? (
                  <Image
                    src={urlFor(aboutData.founderImage).url()}
                    alt={aboutData.founderName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#2C4C5B]/20 text-[#2C4C5B]">
                    Image Required
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h2 className="mb-2 font-serif text-3xl font-medium text-black">Meet Our Founder</h2>
              <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-[#A65D47]">
                {aboutData.founderName}
              </h3>
              <div className="prose prose-sm max-w-none text-black">
                {aboutData.founderBio ? (
                  <PortableText value={aboutData.founderBio} components={founderTextStyles} />
                ) : (
                  <p>Bio coming soon.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. WHERE IT ALL BEGAN */}
      <section ref={storyRef} className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/20 bg-white/10 p-8 shadow-sm backdrop-blur-xl sm:p-12">
          <h2 className="mb-4 font-serif text-3xl font-medium text-black">Where It All Began</h2>
          {isLoading ? (
            <p className="animate-pulse text-xs font-bold uppercase tracking-widest text-[#A65D47]">Loading Story...</p>
          ) : aboutData?.story ? (
            <div className="max-w-2xl">
              <PortableText value={aboutData?.story} components={storyTextStyles} />
            </div>
          ) : (
            <p className="italic text-sm text-black/70">Story content coming soon.</p>
          )}
        </div>
      </section>

      {/* 4. MISSION & VISION (Side by Side Glass Cards) */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center text-center rounded-3xl border border-white/20 bg-white/10 p-8 shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-1">
            <h3 className="mb-3 font-serif text-2xl font-medium text-black">Our Mission</h3>
            <p className="text-sm leading-relaxed text-black">
              {aboutData?.mission || "Mission statement coming soon."}
            </p>
          </div>
          <div className="flex flex-col items-center text-center rounded-3xl border border-white/20 bg-white/10 p-8 shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-1">
            <h3 className="mb-3 font-serif text-2xl font-medium text-black">Our Vision</h3>
            <p className="text-sm leading-relaxed text-black">
              {aboutData?.vision || "Vision statement coming soon."}
            </p>
          </div>
        </div>
      </section>

      {/* 5. FOUNDING PILLARS */}
      {aboutData?.coreValues && aboutData.coreValues.length > 0 && (
        <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-40">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-medium text-black drop-shadow-sm">
              Founding Pillars
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {aboutData.coreValues.map((pillar: any, i: number) => (
              <div
                key={pillar._key || i}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="flex flex-col items-center text-center rounded-3xl border border-white/20 bg-white/10 p-8 shadow-sm backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/20"
              >
                {/* Heading is black, bold, but smaller than the section sub-heading */}
                <h3 className="mb-3 font-serif text-lg font-bold text-black">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed text-black">
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