"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface NewsletterListItem {
  _id: string;
  title: string;
  slug?: { current: string };
  publishedAt?: string;
  excerpt?: string;
  isComingSoon?: boolean;
  coverImageUrl?: string | null;
}

export default function NewsletterArchiveList({ newsletters }: { newsletters: NewsletterListItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? newsletters.filter(
        (n) =>
          n.title?.toLowerCase().includes(query) ||
          n.excerpt?.toLowerCase().includes(query)
      )
    : newsletters;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recent";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div>
      <div className="mx-auto mb-14 max-w-md">
        <div className="group flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 backdrop-blur-xl transition-all focus-within:border-white/30 focus-within:bg-white/10">
          <svg className="h-4 w-4 shrink-0 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="shrink-0 text-white/40 transition-colors hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {newsletters.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 py-20 text-center text-white/60 backdrop-blur-sm">
          No newsletters have been published yet. Check back soon.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 py-20 text-center text-white/60 backdrop-blur-sm">
          No issues match your search.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/10 border-y border-white/10">
          {filtered.map((post) => {
            const isLinkable = !post.isComingSoon && post.slug?.current;

            const Wrapper = isLinkable ? Link : "div";
            const wrapperProps = isLinkable
              ? { href: `/newsletters/${post.slug!.current}` }
              : {};

            return (
              <Wrapper
                key={post._id}
                {...(wrapperProps as any)}
                className={`group flex items-center gap-6 py-7 ${
                  isLinkable ? "cursor-pointer" : "cursor-default opacity-60"
                }`}
              >
                <div className="relative h-24 w-18 flex-shrink-0 overflow-hidden rounded-lg border border-white/15 bg-white/5 sm:h-28 sm:w-20">
                  {post.coverImageUrl ? (
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title || "Newsletter cover"}
                      fill
                      sizes="80px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg className="h-7 w-7 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM9 7h6M9 11h6M9 15h3" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#CFE3E8]/80">
                    {post.isComingSoon ? "Coming Soon" : formatDate(post.publishedAt)}
                  </p>
                  <h2
                    className={`font-serif text-xl leading-snug sm:text-2xl ${
                      isLinkable ? "text-white transition-colors group-hover:text-[#CFE3E8]" : "text-white/70"
                    }`}
                  >
                    {post.title}
                  </h2>
                  {!post.isComingSoon && post.excerpt && (
                    <p className="mt-1.5 line-clamp-1 text-sm text-white/55 sm:line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>

                {isLinkable && (
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-white/30 transition-all group-hover:translate-x-1 group-hover:text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}
