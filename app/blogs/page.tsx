"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../../components/Navbar";
import { client } from "../../lib/sanity";

gsap.registerPlugin(ScrollTrigger);

// Define the shape of our Sanity data
interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
}

// Keep your beautiful color palette to rotate through dynamically
const TAG_STYLES = [
  { bg: "bg-[#F3D6D0]", text: "text-[#8E7A65]" }, // Blush Pink
  { bg: "bg-[#CFE3E8]", text: "text-[#4A6B7C]" }, // Sky Blue
  { bg: "bg-[#F6D86B]/30", text: "text-[#8E7A65]" }, // Soft Sunshine
  { bg: "bg-[#4F6F52]/10", text: "text-[#4F6F52]" }, // Soft Forest
];

export default function BlogsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  
  // Database States
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch from Sanity on Page Load
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        // Fetches all blogs and orders them by date (newest first)
        const data = await client.fetch(`*[_type == "blog"] | order(orderRank)`);
        setBlogs(data);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // 2. Animate the Hero Section (Runs immediately)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ctx = gsap.context(() => {
      gsap.to(".hero-text", {
        opacity: 0,
        y: -50,
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

  // 3. Animate the Cards (Runs ONLY after blogs are loaded)
  useEffect(() => {
    if (blogs.length === 0) return;
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.from(card, {
          opacity: 0,
          y: 40,
          duration: 0.9,
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
  }, [blogs]); // <-- The dependency array watches for the 'blogs' data

  // Helper to make Sanity dates look pretty (e.g., "June 10, 2026")
  const formatDate = (dateString: string) => {
    if (!dateString) return "Recent";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <main className="relative isolate text-[#3A3A38] bg-[#FBF8F2] min-h-screen">
      
      {/* 1. HERO — Sky Video Background */}
      <section ref={heroRef} className="relative h-[80vh] w-full overflow-hidden">
        <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none">
          <video
            className="h-full w-full object-cover opacity-80"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/videos/sky-clouds.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FBF8F2]/60 to-[#FBF8F2]" />
        </div>

        <div className="hero-text relative z-10 flex h-full flex-col items-center justify-center px-6 text-center pt-20">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-[#4F6F52] drop-shadow-sm">
            Gain Perspective
          </p>
          <h1 className="max-w-4xl font-serif text-4xl font-medium leading-tight text-[#3A3A38] sm:text-6xl">
            A Higher Vantage Point
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#3A3A38]/70">
            Insights, reflections, and psychology-backed guidance. Take a breath, look at the bigger picture, and find clarity for your journey.
          </p>
        </div>
      </section>

      {/* 2. THE BLOG GRID */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-40">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">Loading Articles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {blogs.map((post, i) => {
              // Automatically loop through the styles based on the index
              const style = TAG_STYLES[i % TAG_STYLES.length];
              
              return (
                // Changed this to a Next.js Link so it's ready for individual blog pages later
                <Link
                  href={`/blogs/${post.slug?.current || ""}`}
                  key={post._id}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  className="group flex cursor-pointer flex-col rounded-3xl border border-[#3A3A38]/5 bg-white/40 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-white/70 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ${style.bg} ${style.text}`}>
                      Article
                    </span>
                    <span className="text-xs font-medium uppercase tracking-widest text-[#3A3A38]/40">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  
                  <h3 className="mb-4 font-serif text-2xl font-medium leading-snug text-[#3A3A38] transition-colors group-hover:text-[#4F6F52]">
                    {post.title}
                  </h3>
                  
                  <p className="mb-8 flex-grow text-sm leading-relaxed text-[#3A3A38]/70">
                    {post.excerpt}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between border-t border-[#3A3A38]/10 pt-5">
                    <span className="text-xs font-medium uppercase tracking-widest text-[#3A3A38]/50">
                      Read
                    </span>
                    <span className="flex items-center gap-2 text-sm font-medium text-[#3A3A38] transition-colors group-hover:text-[#4F6F52]">
                      Read Article
                      <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Navbar />
    </main>
  );
}