"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PortableText } from "@portabletext/react";
import Navbar from "../components/Navbar";
import { client, urlFor } from "../lib/sanity";

gsap.registerPlugin(ScrollTrigger);

const TIMELINE_DATA = [
  { id: "spark", date: "Dec 2024", title: "The Spark", desc: "My best friend was doing her UG in another state. Every time she called expressing how lonely she felt, I felt guilty and helpless. I realized many students face this across the globe, so I decided to build a non-judgmental support system—a place that felt like home.", align: "far-left" },
  { id: "sarthi", date: "Jan – Jul 2025", title: "Project SARTHI is Born", desc: "I expressed this idea to my professors and batchmates, and they helped me shape this abstract idea into something real. 'SARTHI' was born. It was the beginning of our companion-led approach to mental wellbeing.", align: "bottom-left" },
  { id: "evolution", date: "Aug 2025", title: "Becoming Psychology Embassy", desc: "In our final year, we realized this initiative alone might not survive after we left college. We needed something solid and long-term. The vision changed, and we became 'Psychology Embassy'.", align: "bottom-center" },
  { id: "event", date: "Sep 2025", title: "First Official Event", desc: "Our first official event took place on World Suicide Prevention Day. Over 50 people joined our community; everyone was excited, and the project finally became a reality.", align: "bottom-right" },
  { id: "startup", date: "Jan – Jun 2026", title: "Registered as a Start-up", desc: "We organized internship guidance, outdoor events, and community meet-ups. Psychology Embassy officially registered as a Start-up. As we complete our degrees, we know the journey will be challenging, but we are a team working to make our ideas a concrete reality.", align: "far-right" },
];

// Styles for the rich text editor inside the Initiative section
const portableTextStyles: any = {
  block: {
    normal: ({ children }: any) => <p className="mb-6 text-base leading-relaxed text-[#3A3A38]/80">{children}</p>,
    blockquote: ({ children }: any) => (
      <div className="my-6 border-l-2 border-[#4F6F52] pl-6">
        <p className="font-serif text-2xl italic leading-relaxed text-[#3A3A38]">{children}</p>
      </div>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-semibold text-[#3A3A38]">{children}</strong>,
  },
};

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const journeyPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const initiativesRef = useRef<(HTMLAnchorElement | null)[]>([]);

  const [initiatives, setInitiatives] = useState<any[]>([]);

  // Fetch Initiatives from Sanity
  useEffect(() => {
    const fetchInitiatives = async () => {
      try {
        const data = await client.fetch(`*[_type == "initiative"] | order(orderRank)`);
        setInitiatives(data);
      } catch (error) {
        console.error("Error fetching initiatives:", error);
      }
    };
    fetchInitiatives();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      gsap.to(".hero-text", { opacity: 0, y: -40, ease: "none", scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true } });

      journeyPathRefs.current.forEach((path) => {
        if (!path) return;
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: path, start: "top 85%", end: "bottom 60%", scrub: true } });
      });

      gsap.utils.toArray<HTMLElement>(".journey-node").forEach((node) => {
        gsap.from(node, { opacity: 0, y: 20, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: node, start: "top 80%", toggleActions: "play none none reverse" } });
      });

      gsap.utils.toArray<HTMLElement>(".root-timeline-card").forEach((card, i) => {
        gsap.from(card, { opacity: 0, y: 24, duration: 0.7, delay: i * 0.05, ease: "power2.out", scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none reverse" } });
      });

      initiativesRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.from(card, { opacity: 0, y: 30, duration: 0.8, delay: i * 0.15, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 90%", toggleActions: "play none none reverse" } });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="relative isolate text-[#3A3A38]">
      {/* 1. HERO */}
      <section ref={heroRef} className="relative h-[100vh] w-full overflow-hidden">
        <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none">
          <video className="h-full w-full object-cover" autoPlay muted loop playsInline>
            <source src="/videos/sunlit-forest-road.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#FBF8F2]/30 via-transparent to-[#FBF8F2]/60" />
        </div>
        <div className="hero-text relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <h1 className="max-w-3xl font-serif text-4xl font-medium leading-tight text-[#F6D86B] drop-shadow-[0_2px_18px_rgba(246,216,107,0.45)] sm:text-6xl" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}>
            You are on a better path.
          </h1>
        </div>
      </section>

      {/* 2. THE WAVY JOURNEY */}
      <section className="journey-section relative mx-auto flex min-h-[180vh] w-full flex-col items-center overflow-hidden px-6 pt-32 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 100% at center, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.10) 45%, transparent 75%)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", maskImage: "radial-gradient(ellipse 60% 100% at center, black 0%, black 50%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 60% 100% at center, black 0%, black 50%, transparent 80%)" }} />
        <div className="relative flex w-full max-w-2xl flex-col items-center pb-0">
          {[
            { num: "1", title: "Our Mission", desc: "To make psychological support feel as natural and accessible as a conversation with a trusted friend — without judgment, without stigma." },
            { num: "2", title: "Our Vision", desc: "A community where emotional wellbeing is treated with the same care and seriousness as physical health, rooted in empathy." },
            { num: "3", title: "Our Timeline", desc: "From a single idea to a registered organisation — every step of our journey, branching outward like roots in good soil." }
          ].map((node, i) => (
            <div key={node.num} className="flex w-full flex-col items-center">
              <div className="journey-node relative flex flex-col items-center gap-4 py-8">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#4F6F52] bg-[#FBF8F2]/10 font-serif text-xl font-medium text-[#FBF8F2]">{node.num}</div>
                <h3 className="font-serif text-2xl font-medium text-[#FBF8F2] sm:text-3xl">{node.title}</h3>
                <p className="max-w-md text-base leading-relaxed text-[#FBF8F2]/90">{node.desc}</p>
              </div>
              {i < 2 && (
                <div className="flex w-full justify-center py-2">
                  <svg width="40" height="100" viewBox="0 0 40 100" fill="none"><path ref={(el) => { journeyPathRefs.current[i] = el; }} d={i % 2 === 0 ? "M 20 0 C 40 30, 0 70, 20 100" : "M 20 0 C 0 30, 40 70, 20 100"} stroke="#4F6F52" strokeWidth="3" strokeLinecap="round" /></svg>
                </div>
              )}
            </div>
          ))}
          <div className="flex w-full justify-center py-2">
            <svg width="40" height="140" viewBox="0 0 40 140" fill="none"><path ref={(el) => { journeyPathRefs.current[3] = el; }} d="M 20 0 C 0 40, 40 100, 20 140" stroke="#4F6F52" strokeWidth="3" strokeLinecap="round" /></svg>
          </div>
        </div>
      </section>

      {/* 3 & 4. THE TIMELINE BACKGROUND */}
      <section 
        className="relative w-full overflow-hidden" 
        style={{ backgroundImage: "url('https://cdn.pixabay.com/photo/2013/02/20/11/30/autumn-83761_1280.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex min-h-[40vh] w-full flex-col items-center justify-center px-6 py-24 sm:px-10">
          <div className="relative z-10 mx-auto mb-16 text-center">
            <h2 className="font-serif text-4xl font-medium tracking-wide text-[#000000f8] sm:text-3xl">
              How We Have Grown
            </h2>
          </div>

          <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-12">
            {TIMELINE_DATA.map((item) => (
              <div key={item.id} className={`root-timeline-card flex flex-col rounded-2xl border border-[#4F6F52]/15 bg-[#FBF8F2]/95 p-6 shadow-sm backdrop-blur-sm ${item.align === "far-left" ? "sm:col-start-1 sm:row-start-1" : ""} ${item.align === "bottom-left" ? "sm:col-start-1 sm:row-start-2 sm:mt-6" : ""} ${item.align === "bottom-center" ? "sm:col-start-2 sm:row-start-1 sm:row-span-2 sm:self-center" : ""} ${item.align === "bottom-right" ? "sm:col-start-3 sm:row-start-2 sm:mt-6" : ""} ${item.align === "far-right" ? "sm:col-start-3 sm:row-start-1" : ""}`}>
                <span className="mb-2 inline-block w-fit rounded-full bg-[#CFE3E8] px-3 py-1 text-xs font-medium uppercase tracking-wider text-[#3A3A38]">{item.date}</span>
                <h4 className="mb-2 font-serif text-xl font-medium text-[#3A3A38]">{item.title}</h4>
                <p className="text-sm leading-relaxed text-[#3A3A38]/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. DYNAMIC INITIATIVES SECTION */}
      {initiatives.map((init, index) => (
        <section key={init._id || index} className="relative w-full bg-[#FBF8F2] px-6 pt-32 sm:px-12">
          <div className="mx-auto max-w-6xl">
            
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm uppercase tracking-[0.35em] text-[#4F6F52]">Our Initiatives</p>
              <h2 className="font-serif text-4xl font-medium text-[#3A3A38] sm:text-6xl">{init.title}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[#3A3A38]/70">
                {init.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
              
              {/* Left Column: The Narrative (Rich Text) */}
              <div className="flex flex-col gap-6 lg:col-span-7">
                {init.body ? (
                  <PortableText value={init.body} components={portableTextStyles} />
                ) : (
                  <p className="italic text-[#3A3A38]/50">Narrative coming soon...</p>
                )}
              </div>

              {/* Right Column: Vision, Mission & Offerings */}
              <div className="flex flex-col gap-8 lg:col-span-5">
                
                {/* Logo */}
                {init.logo && (
                  <div className="flex aspect-video w-full items-center justify-center rounded-3xl border border-[#3A3A38]/10 bg-white/50 shadow-sm p-8">
                    <div className="relative h-full w-full">
                      <Image 
                        src={urlFor(init.logo).url()} 
                        alt={`${init.title} Logo`} 
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Vision */}
                {init.vision && (
                  <div className="rounded-3xl border border-[#4F6F52]/20 bg-[#4F6F52]/5 p-8">
                    <h3 className="mb-3 font-serif text-2xl text-[#3A3A38]">Our Vision</h3>
                    <p className="text-sm leading-relaxed text-[#3A3A38]/80">{init.vision}</p>
                  </div>
                )}

                {/* Mission */}
                {init.mission && init.mission.length > 0 && (
                  <div className="rounded-3xl border border-[#3A3A38]/10 bg-white p-8 shadow-sm">
                    <h3 className="mb-4 font-serif text-2xl text-[#3A3A38]">Our Mission</h3>
                    <ul className="flex flex-col gap-3 text-sm text-[#3A3A38]/80">
                      {init.mission.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-[#4F6F52]">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Offerings */}
                {init.offerings && init.offerings.length > 0 && (
                  <div className="rounded-3xl border border-[#88B7B5]/20 bg-[#88B7B5]/10 p-8">
                    <h3 className="mb-4 font-serif text-2xl text-[#2C4C5B]">What We Offer</h3>
                    <ul className="mb-6 flex flex-col gap-3 text-sm text-[#3A3A38]/80">
                      {init.offerings.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#88B7B5]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> 
                          {item}
                        </li>
                      ))}
                    </ul>
                    {init.quote && (
                      <p className="font-serif text-lg italic text-[#2C4C5B]">"{init.quote}"</p>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>
      ))}

      {/* 6. BRIDGE LINKS TO OTHER PAGES */}
      <section className="relative w-full bg-[#FBF8F2] px-6 pb-40 pt-24">
        <div className="footer-divider mx-auto mb-16 h-px w-full max-w-6xl origin-left bg-[#3A3A38]/10" />
        
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
          <Link href="/book" ref={(el) => { initiativesRef.current[0] = el; }} className="group flex flex-col items-center justify-center rounded-3xl border border-[#3A3A38]/5 bg-white/60 p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/90 hover:shadow-xl">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] transition-transform duration-500 group-hover:scale-110 group-hover:bg-[#1E3A5F] group-hover:text-white"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
            <h3 className="mb-3 font-serif text-2xl font-medium text-[#3A3A38]">Book a Session</h3>
            <p className="mb-6 text-sm leading-relaxed text-[#3A3A38]/70">Find a safe harbor. Connect with our companions and start your journey at your own pace.</p>
            <span className="mt-auto text-xs font-semibold uppercase tracking-widest text-[#4F6F52] group-hover:underline">Schedule Now →</span>
          </Link>
          <Link href="/blogs" ref={(el) => { initiativesRef.current[1] = el; }} className="group flex flex-col items-center justify-center rounded-3xl border border-[#3A3A38]/5 bg-white/60 p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/90 hover:shadow-xl">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#CFE3E8]/40 text-[#4A6B7C] transition-transform duration-500 group-hover:scale-110 group-hover:bg-[#4A6B7C] group-hover:text-white"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
            <h3 className="mb-3 font-serif text-2xl font-medium text-[#3A3A38]">Gain Perspective</h3>
            <p className="mb-6 text-sm leading-relaxed text-[#3A3A38]/70">Insights, reflections, and psychology-backed guidance written directly by our team.</p>
            <span className="mt-auto text-xs font-semibold uppercase tracking-widest text-[#4A6B7C] group-hover:underline">Read Articles →</span>
          </Link>
          <Link href="/courses" ref={(el) => { initiativesRef.current[2] = el; }} className="group flex flex-col items-center justify-center rounded-3xl border border-[#3A3A38]/5 bg-white/60 p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/90 hover:shadow-xl">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F6D86B]/30 text-[#8E7A65] transition-transform duration-500 group-hover:scale-110 group-hover:bg-[#F6D86B] group-hover:text-white"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
            <h3 className="mb-3 font-serif text-2xl font-medium text-[#3A3A38]">Grow With Us</h3>
            <p className="mb-6 text-sm leading-relaxed text-[#3A3A38]/70">Expand your clinical understanding through our structured courses and community internships.</p>
            <span className="mt-auto text-xs font-semibold uppercase tracking-widest text-[#8E7A65] group-hover:underline">Explore Programs →</span>
          </Link>
        </div>
      </section>
      <Navbar />
    </main>
  );
}