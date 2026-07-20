"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../../components/Navbar";
import { client } from "../../lib/sanity";
import { supabase } from "../../lib/supabase";
import { StarRatingDisplay } from "../../components/StarRating";

gsap.registerPlugin(ScrollTrigger);

interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
  isComingSoon?: boolean; // NEW FIELD
}

const TAG_STYLES = [
  { bg: "bg-[#F3D6D0]", text: "text-[#8E7A65]" }, 
  { bg: "bg-[#CFE3E8]", text: "text-[#4A6B7C]" }, 
  { bg: "bg-[#F6D86B]/30", text: "text-[#8E7A65]" }, 
  { bg: "bg-[#4F6F52]/10", text: "text-[#4F6F52]" }, 
];

export default function BlogsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({});

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await client.fetch(`*[_type == "blog"] | order(orderRank)`);
        setBlogs(data);

        const { data: ratingRows, error } = await supabase
          .from("blog_ratings")
          .select("blog_id, rating");

        if (ratingRows && !error) {
          const grouped: Record<string, { sum: number; count: number }> = {};
          ratingRows.forEach((row: any) => {
            if (!grouped[row.blog_id]) grouped[row.blog_id] = { sum: 0, count: 0 };
            grouped[row.blog_id].sum += row.rating;
            grouped[row.blog_id].count += 1;
          });
          const averages: Record<string, { average: number; count: number }> = {};
          Object.entries(grouped).forEach(([blogId, { sum, count }]) => {
            averages[blogId] = { average: sum / count, count };
          });
          setRatings(averages);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

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
  }, [blogs]); 

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

      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-40">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">Loading Articles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {blogs.map((post, i) => {
              const style = TAG_STYLES[i % TAG_STYLES.length];
              
              return (
                <Link
                  href={post.isComingSoon ? "#" : `/blogs/${post.slug?.current || ""}`}
                  onClick={(e) => post.isComingSoon && e.preventDefault()}
                  key={post._id}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  className={`group flex flex-col rounded-3xl border border-[#3A3A38]/5 bg-white/40 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-md ${
                    post.isComingSoon 
                      ? "opacity-60 cursor-default" 
                      : "cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:bg-white/70 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
                  }`}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ${style.bg} ${style.text} ${post.isComingSoon ? "opacity-50" : ""}`}>
                      Article
                    </span>
                    {/* HIDE DATE IF COMING SOON */}
                    {!post.isComingSoon && (
                      <span className="text-xs font-medium uppercase tracking-widest text-[#3A3A38]/40">
                        {formatDate(post.publishedAt)}
                      </span>
                    )}
                  </div>
                  
                  <h3 className={`font-serif text-2xl font-medium leading-snug ${post.isComingSoon ? "text-[#3A3A38]/70 mt-4 mb-0" : "text-[#3A3A38] mb-4 transition-colors group-hover:text-[#4F6F52]"}`}>
                    {post.title}
                  </h3>
                  
                  {/* HIDE EXCERPT IF COMING SOON */}
                  {!post.isComingSoon && (
                    <p className="mb-8 flex-grow text-sm leading-relaxed text-[#3A3A38]/70">
                      {post.excerpt}
                    </p>
                  )}
                  
                  <div className={`mt-auto flex items-center justify-between border-t border-[#3A3A38]/10 pt-5 ${post.isComingSoon ? "mt-8" : ""}`}>
                    {post.isComingSoon ? (
                      <>
                        <span className="text-xs font-medium uppercase tracking-widest text-[#3A3A38]/50">
                          Status
                        </span>
                        <span className="text-sm font-medium text-[#3A3A38]/40">
                          Coming Soon
                        </span>
                      </>
                    ) : (
                      <StarRatingDisplay
                        average={ratings[post._id]?.average || 0}
                        count={ratings[post._id]?.count || 0}
                      />
                    )}
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