"use client";
import { useRef, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../../components/Navbar";
import VideoBackground from "../../components/VideoBackground";
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
  isComingSoon?: boolean;
}

const TAG_STYLES = [
  { bg: "bg-[#F3D6D0]", text: "text-[#8E7A65]" }, 
  { bg: "bg-[#CFE3E8]", text: "text-[#4A6B7C]" }, 
  { bg: "bg-[#F6D86B]/30", text: "text-[#8E7A65]" }, 
  { bg: "bg-[#4F6F52]/10", text: "text-[#4F6F52]" }, 
];

export default function BlogsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const hasAnimatedCards = useRef(false);

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "earliest" | "popularity">("latest");

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

  // Search: matches title or excerpt, case-insensitive.
  // Sort: Latest/Earliest by publish date, Popularity by rating count
  // (more ratings = more popular), then by average rating as a tiebreaker.
  // "Coming soon" posts have no date/ratings yet, so they're always sorted
  // to the end rather than randomly landing first under a date sort.
  const visibleBlogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? blogs.filter(
          (post) =>
            post.title?.toLowerCase().includes(query) ||
            post.excerpt?.toLowerCase().includes(query)
        )
      : blogs;

    const sorted = [...filtered].sort((a, b) => {
      if (a.isComingSoon && !b.isComingSoon) return 1;
      if (!a.isComingSoon && b.isComingSoon) return -1;
      if (a.isComingSoon && b.isComingSoon) return 0;

      if (sortBy === "popularity") {
        const aStats = ratings[a._id] || { average: 0, count: 0 };
        const bStats = ratings[b._id] || { average: 0, count: 0 };
        if (bStats.count !== aStats.count) return bStats.count - aStats.count;
        return bStats.average - aStats.average;
      }

      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return sortBy === "earliest" ? aTime - bTime : bTime - aTime;
    });

    return sorted;
  }, [blogs, ratings, searchQuery, sortBy]);

  // Runs once, the first time cards land on the page. Re-sorting or
  // searching just reorders/filters the existing elements — it must NOT
  // replay this animation, or every card fades out and back in each time
  // (which is what was happening before).
  useEffect(() => {
    if (isLoading || hasAnimatedCards.current || blogs.length === 0) return;
    hasAnimatedCards.current = true;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".blog-card");
      cards.forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          y: 40,
          duration: 0.9,
          delay: i * 0.06,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });
    });

    return () => ctx.revert();
  }, [isLoading, blogs]);

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
          <VideoBackground
            src="/videos/sky-clouds.mp4"
            poster="/videos/posters/sky-clouds.jpg"
          />
        </div>

        <div className="hero-text relative z-10 flex h-full flex-col items-center justify-center px-6 text-center pt-20">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-black drop-shadow-md">
            Gain Perspective
          </p>
          <h1 className="max-w-4xl font-serif text-4xl font-medium leading-tight text-black drop-shadow-lg sm:text-6xl">
            A Higher Vantage Point
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-black drop-shadow-md">
            Insights, reflections, and psychology-backed guidance. Take a breath, look at the bigger picture, and find clarity for your journey.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-40">
        {/* Search + Sort */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A38]/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.4 4.4a7.5 7.5 0 0012.25 12.25z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full rounded-full border border-[#3A3A38]/10 bg-white/60 py-3 pl-11 pr-5 text-sm text-[#3A3A38] placeholder:text-[#3A3A38]/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]/30"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
            {(
              [
                { key: "latest", label: "Latest" },
                { key: "earliest", label: "Earliest" },
                { key: "popularity", label: "Popularity" },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                onClick={() => setSortBy(option.key)}
                className={`rounded-full px-4 py-2 transition-colors ${
                  sortBy === option.key
                    ? "bg-[#4F6F52] text-white"
                    : "bg-white/50 text-[#3A3A38]/60 hover:bg-white/80"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">Loading Articles...</p>
          </div>
        ) : visibleBlogs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <p className="text-sm text-[#3A3A38]/60">No articles match "{searchQuery}".</p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-medium uppercase tracking-widest text-[#4F6F52] hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {visibleBlogs.map((post, i) => {
              const style = TAG_STYLES[i % TAG_STYLES.length];
              
              return (
                <Link
                  href={post.isComingSoon ? "#" : `/blogs/${post.slug?.current || ""}`}
                  onClick={(e) => post.isComingSoon && e.preventDefault()}
                  key={post._id}
                  className={`blog-card group flex flex-col rounded-3xl border border-[#3A3A38]/5 bg-white/40 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-md ${
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
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs font-medium text-[#3A3A38]/50">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.31 0-6 1.79-6 4v1h12v-1c0-2.21-2.69-4-6-4z" />
                          </svg>
                          {ratings[post._id]?.count || 0}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-widest text-black/60">
                          {formatDate(post.publishedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className={`font-serif text-2xl font-medium leading-snug ${post.isComingSoon ? "text-black/70 mt-4 mb-0" : "text-black mb-4 transition-colors group-hover:text-[#4F6F52]"}`}>
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
                        <span className="text-sm font-medium text-[#3A3A38]/50">
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