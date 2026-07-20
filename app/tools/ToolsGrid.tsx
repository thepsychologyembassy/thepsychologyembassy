"use client";

import { useState } from "react";
import Link from "next/link";

interface Tool {
  _id: string;
  title: string;
  category?: string;
  time?: string;
  shortDescription?: string;
  isComingSoon?: boolean;
  slug?: { current: string };
}

export default function ToolsGrid({ tools }: { tools: Tool[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = tools.filter((tool) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      tool.title?.toLowerCase().includes(query) ||
      tool.category?.toLowerCase().includes(query) ||
      tool.shortDescription?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <div className="mx-auto mb-12 max-w-xl">
        <div className="group flex items-center gap-3 rounded-full border border-[#3A3A38]/10 bg-white/60 px-6 py-4 shadow-sm backdrop-blur-xl transition-all focus-within:border-[#4F6F52]/40 focus-within:bg-white/80 focus-within:shadow-md">
          <svg className="h-5 w-5 shrink-0 text-[#3A3A38]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tests & tools..."
            className="w-full bg-transparent text-sm text-[#3A3A38] placeholder:text-[#3A3A38]/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="shrink-0 text-[#3A3A38]/40 transition-colors hover:text-[#3A3A38]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {!tools || tools.length === 0 ? (
        <div className="text-center py-20 text-[#3A3A38]/60 font-medium bg-white/40 rounded-3xl backdrop-blur-sm border border-white/20">
          No tools available at the moment. Check back soon!
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="text-center py-20 text-[#3A3A38]/60 font-medium bg-white/40 rounded-3xl backdrop-blur-sm border border-white/20">
          No tests or tools match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool: any) => (
            <div
              key={tool._id}
              className={`flex flex-col overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white/70 backdrop-blur-md shadow-sm ${
                tool.isComingSoon
                  ? "opacity-60"
                  : "transition-all hover:-translate-y-1 hover:shadow-lg"
              }`}
            >
              <div className="p-8 flex flex-col h-full relative">

                {/* COMING SOON BADGE */}
                {tool.isComingSoon && (
                  <span className="absolute top-8 right-8 rounded-full bg-[#3A3A38]/5 border border-[#3A3A38]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#3A3A38]/60">
                    Coming Soon
                  </span>
                )}

                {/* HIDE CATEGORY & TIME IF COMING SOON */}
                {!tool.isComingSoon && (
                  <div className="flex justify-between items-start mb-4 pr-16">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#88B7B5]">{tool.category || 'Resource'}</span>
                    {tool.time && <span className="text-[10px] font-semibold text-[#3A3A38]/50">{tool.time}</span>}
                  </div>
                )}

                <h3 className={`font-serif text-2xl ${tool.isComingSoon ? "text-[#2C4C5B]/70 mb-0 mt-8" : "text-[#2C4C5B] mb-3"}`}>{tool.title}</h3>

                {/* HIDE DESCRIPTION IF COMING SOON OR NOT PROVIDED */}
                {!tool.isComingSoon && tool.shortDescription && (
                  <p className="text-sm text-[#3A3A38]/80 line-clamp-3 leading-relaxed flex-1">
                    {tool.shortDescription}
                  </p>
                )}

                {tool.isComingSoon ? (
                  <div className="mt-8 inline-block text-center rounded-full bg-[#3A3A38]/5 border border-[#3A3A38]/10 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#3A3A38]/40 cursor-not-allowed">
                    In Development
                  </div>
                ) : tool.slug?.current && (
                  <Link
                    href={`/tools/${tool.slug.current}`}
                    className="mt-auto inline-block text-center rounded-full bg-[#4F6F52] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-transform hover:-translate-y-1 hover:shadow-md"
                  >
                    Read More
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
