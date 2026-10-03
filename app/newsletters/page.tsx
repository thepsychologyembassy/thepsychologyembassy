"use client";
import { useRef, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../../components/Navbar";
import VideoBackground from "../../components/VideoBackground";
import { client, urlFor } from "../../lib/sanity";

gsap.registerPlugin(ScrollTrigger);

interface NewsletterPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
  isComingSoon?: boolean;
  coverImage?: any;
  pdfUrl?: string;
}

const TAG_STYLES = [
  { bg: "bg-[#F3D6D0]", text: "text-[#8E7A65]" },
  { bg: "bg-[#CFE3E8]", text: "text-[#4A6B7C]" },
  { bg: "bg-[#F6D86B]/30", text: "text-[#8E7A65]" },
  { bg: "bg-[#4F6F52]/10", text: "text-[#4F6F52]" },
];

export default function NewslettersPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const hasAnimatedCards = useRef(false);

  const [newsletters, setNewsletters] = useState<NewsletterPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "earliest">("latest");

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        const data = await client.fetch(
          `*[_type == "newsletter"] | order(orderRank) {
            ...,
            "pdfUrl": pdfFile.asset->url
          }`
        );
        setNewsletters(data);
      } catch (error) {
        console.error("Error fetching newsletters:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNewsletters();
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

  // "Coming soon" newsletters always sort to the end, same convention as
  // the blogs listing.
  const visibleNewsletters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? newsletters.filter(
          (post) =>
            post.title?.toLowerCase().includes(query) ||
            post.excerpt?.toLowerCase().includes(query)
        )
      : newsletters;

    const sorted = [...filtered].sort((a, b) => {
      if (a.isComingSoon && !b.isComingSoon) return 1;
      if (!a.isComingSoon && b.isComingSoon) return -1;
      if (a.isComingSoon && b.isComingSoon) return 0;

      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return sortBy === "earliest" ? aTime - bTime : bTime - aTime;
    });

    return sorted;
  }, [newsletters, searchQuery, sortBy]);

  useEffect(() => {
    if (isLoading || hasAnimatedCards.current || newsletters.length === 0) return;
    hasAnimatedCards.current = true;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".newsletter-card");
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
  }, [isLoading, newsletters]);

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
          <VideoBackground src="/videos/sky-clouds.mp4" poster="/videos/posters/sky-clouds.jpg" />
        </div>

        <div className="hero-text relative z-10 flex h-full flex-col items-center justify-center px-6 text-center pt-20">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-black drop-shadow-md">
            Stay Connected
          </p>
          <h1 className="max-w-4xl font-serif text-4xl font-medium leading-tight text-black drop-shadow-lg sm:text-6xl">
            Our Newsletters
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-black drop-shadow-md">
            Updates, stories, and reflections from The Psychology Embassy — flip through each issue or download it to keep.
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
              placeholder="Search newsletters..."
              className="w-full rounded-full border border-[#3A3A38]/10 bg-white/60 py-3 pl-11 pr-5 text-sm text-[#3A3A38] placeholder:text-[#3A3A38]/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#4F6F52]/30"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest">
            {(
              [
                { key: "latest", label: "Latest" },
                { key: "earliest", label: "Earliest" },
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
            <p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">Loading Newsletters...</p>
          </div>
        ) : visibleNewsletters.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <p className="text-sm text-[#3A3A38]/60">
              {searchQuery ? `No newsletters match "${searchQuery}".` : "No newsletters published yet."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-medium uppercase tracking-widest text-[#4F6F52] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {visibleNewsletters.map((post, i) => {
              const style = TAG_STYLES[i % TAG_STYLES.length];

              return (
                <Link
                  href={post.isComingSoon ? "#" : `/newsletters/${post.slug?.current || ""}`}
                  onClick={(e) => post.isComingSoon && e.preventDefault()}
                  key={post._id}
                  className={`newsletter-card group flex flex-col overflow-hidden rounded-3xl border border-[#3A3A38]/5 bg-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-md ${
                    post.isComingSoon
                      ? "opacity-60 cursor-default"
                      : "cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:bg-white/70 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
                  }`}
                >
                  {post.coverImage && (
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={urlFor(post.coverImage).width(800).height(400).url()}
                        alt={post.title || "Newsletter cover"}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-8">
                    <div className="mb-6 flex items-center justify-between">
                      <span className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ${style.bg} ${style.text} ${post.isComingSoon ? "opacity-50" : ""}`}>
                        Newsletter
                      </span>
                      {!post.isComingSoon && (
                        <span className="text-xs font-medium uppercase tracking-widest text-black/60">
                          {formatDate(post.publishedAt)}
                        </span>
                      )}
                    </div>

                    <h3 className={`font-serif text-2xl font-medium leading-snug ${post.isComingSoon ? "text-black/70 mt-4 mb-0" : "text-black mb-4 transition-colors group-hover:text-[#4F6F52]"}`}>
                      {post.title}
                    </h3>

                    {!post.isComingSoon && post.excerpt && (
                      <p className="mb-8 flex-grow text-sm leading-relaxed text-[#3A3A38]/70">
                        {post.excerpt}
                      </p>
                    )}

                    <div className={`mt-auto flex items-center justify-between border-t border-[#3A3A38]/10 pt-5 ${post.isComingSoon ? "mt-8" : ""}`}>
                      {post.isComingSoon ? (
                        <>
                          <span className="text-xs font-medium uppercase tracking-widest text-[#3A3A38]/50">Status</span>
                          <span className="text-sm font-medium text-[#3A3A38]/50">Coming Soon</span>
                        </>
                      ) : (
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#4F6F52]">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s4.332.477 5.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Read & Download
                        </span>
                      )}
                    </div>
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
