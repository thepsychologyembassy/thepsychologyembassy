"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import Navbar from "../../../components/Navbar";
import { client, urlFor } from "../../../lib/sanity";
import { supabase } from "../../../lib/supabase";
import { StarRatingDisplay, StarRatingInput } from "../../../components/StarRating";

// Added 'any' type here to prevent TypeScript from over-analyzing the rich text objects
const portableTextStyles: any = {
  block: {
    normal: ({ children }: any) => <p className="mb-6 text-lg leading-relaxed text-[#3A3A38]/80">{children}</p>,
    h1: ({ children }: any) => <h1 className="mt-12 mb-6 font-serif text-4xl font-medium text-[#2C4C5B]">{children}</h1>,
    h2: ({ children }: any) => <h2 className="mt-10 mb-4 font-serif text-3xl font-medium text-[#2C4C5B]">{children}</h2>,
    h3: ({ children }: any) => <h3 className="mt-8 mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">{children}</h3>,
    blockquote: ({ children }: any) => <blockquote className="my-8 border-l-4 border-[#88B7B5] bg-[#88B7B5]/5 py-4 pl-6 pr-4 text-lg italic text-[#3A3A38]/70">{children}</blockquote>,
  },
  list: {
    bullet: ({ children }: any) => <ul className="mb-6 list-disc space-y-2 pl-6 text-lg text-[#3A3A38]/80 marker:text-[#88B7B5]">{children}</ul>,
    number: ({ children }: any) => <ol className="mb-6 list-decimal space-y-2 pl-6 text-lg text-[#3A3A38]/80 marker:text-[#88B7B5]">{children}</ol>,
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-semibold text-[#3A3A38]">{children}</strong>,
    link: ({ children, value }: any) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="border-b border-[#88B7B5] text-[#2C4C5B] transition-colors hover:bg-[#88B7B5]/10 hover:text-[#4F6F52]">
        {children}
      </a>
    ),
  },
};

export default function ArticlePage() {
  // Explicitly told TypeScript that "slug" is a string
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [ratingEntries, setRatingEntries] = useState<
    { id: string; rating: number; comment: string | null; commenter_name: string | null; created_at: string }[]
  >([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);

  const [selectedRating, setSelectedRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [nameText, setNameText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      // Safety check to ensure the slug exists before making the database call
      if (!params?.slug) return;
      
      try {
        const data = await client.fetch(
          `*[_type == "blog" && slug.current == $slug][0]`,
          { slug: params.slug }
        );
        setPost(data);
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPost();
  }, [params?.slug]);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!post?._id) return;
      setRatingsLoading(true);
      try {
        const { data, error } = await supabase
          .from("blog_ratings")
          .select("id, rating, comment, commenter_name, created_at")
          .eq("blog_id", post._id)
          .order("created_at", { ascending: false });

        if (data && !error) setRatingEntries(data);
      } catch (error) {
        console.error("Error fetching ratings:", error);
      } finally {
        setRatingsLoading(false);
      }
    };
    fetchRatings();
  }, [post?._id]);

  const average =
    ratingEntries.length > 0
      ? ratingEntries.reduce((sum, r) => sum + r.rating, 0) / ratingEntries.length
      : 0;

  const handleSubmitRating = async () => {
    if (selectedRating < 1) {
      setSubmitError("Please select a star rating before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/blogs/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blog_id: post._id,
          rating: selectedRating,
          comment: commentText,
          commenter_name: nameText,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");

      setSubmitSuccess(true);
      setRatingEntries((prev) => [
        {
          id: `temp-${Date.now()}`,
          rating: selectedRating,
          comment: commentText.trim() || null,
          commenter_name: nameText.trim() || null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSelectedRating(0);
      setCommentText("");
      setNameText("");
    } catch (error: any) {
      setSubmitError(error.message || "Failed to submit your rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBF8F2]">
        <p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">Loading Article...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FBF8F2] text-center">
        <h1 className="font-serif text-4xl text-[#3A3A38]">Article not found</h1>
        <Link href="/blogs" className="mt-6 border-b border-[#3A3A38] text-[#3A3A38]/60 pb-1 uppercase tracking-widest hover:text-[#3A3A38]">
          Return to Blogs
        </Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#FBF8F2] text-[#3A3A38] pb-32 pt-24 sm:pt-32">
      <article className="mx-auto max-w-3xl px-6">
        
        {/* Navigation */}
        <div className="mb-12">
          <Link href="/blogs" className="group flex w-fit items-center gap-2 text-sm font-medium uppercase tracking-widest text-[#3A3A38]/50 transition-colors hover:text-[#4F6F52]">
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            Back to Articles
          </Link>
        </div>

        {/* Header */}
        <header className="mb-12 text-center sm:mb-16">
          {post.publishedAt && (
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#88B7B5]">
              {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
          <h1 className="font-serif text-4xl font-medium leading-tight text-[#2C4C5B] sm:text-5xl md:text-6xl">
            {post.title}
          </h1>
        </header>

        {/* Optional Main Image */}
        {post.mainImage && (
          <div className="relative mb-12 h-[40vh] w-full overflow-hidden rounded-3xl sm:h-[60vh]">
            <Image 
              src={urlFor(post.mainImage).url()} 
              alt={post.title || "Blog Image"} 
              fill 
              sizes="(max-width: 1024px) 100vw, 800px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* The Blog Content */}
        <div className="mx-auto max-w-2xl">
          {post.body ? (
            <PortableText value={post.body} components={portableTextStyles} />
          ) : (
            <p className="text-center italic text-[#3A3A38]/50">No content available for this article.</p>
          )}
        </div>

        {/* Rating & Comments */}
        <div className="mx-auto mt-16 max-w-2xl border-t border-[#3A3A38]/10 pt-12">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <h2 className="font-serif text-2xl font-medium text-[#2C4C5B]">Rate This Article</h2>
            {!ratingsLoading && (
              <StarRatingDisplay average={average} count={ratingEntries.length} size="md" />
            )}
          </div>

          <div className="rounded-3xl border border-[#3A3A38]/10 bg-white/60 p-8 shadow-sm backdrop-blur-md">
            {submitSuccess ? (
              <p className="text-center text-sm font-medium text-[#4F6F52]">
                Thanks for your rating! Your feedback has been recorded.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <StarRatingInput value={selectedRating} onChange={setSelectedRating} />

                <input
                  type="text"
                  value={nameText}
                  onChange={(e) => setNameText(e.target.value)}
                  placeholder="Your name (optional)"
                  maxLength={100}
                  className="w-full rounded-full border border-[#3A3A38]/10 bg-white/70 px-5 py-3 text-sm text-[#3A3A38] placeholder:text-[#3A3A38]/40 focus:outline-none focus:ring-2 focus:ring-[#4F6F52]/30"
                />

                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share a comment about this article (optional)"
                  maxLength={2000}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[#3A3A38]/10 bg-white/70 px-5 py-4 text-sm leading-relaxed text-[#3A3A38] placeholder:text-[#3A3A38]/40 focus:outline-none focus:ring-2 focus:ring-[#4F6F52]/30"
                />

                {submitError && (
                  <p className="text-sm font-medium text-[#A65D47]">{submitError}</p>
                )}

                <button
                  onClick={handleSubmitRating}
                  disabled={submitting}
                  className="rounded-full bg-[#4F6F52] px-8 py-3 text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-1 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Rating"}
                </button>
              </div>
            )}
          </div>

          {/* Comments List */}
          {ratingEntries.some((r) => r.comment) && (
            <div className="mt-12">
              <h3 className="mb-6 font-serif text-xl font-medium text-[#2C4C5B]">Reader Comments</h3>
              <div className="flex flex-col gap-4">
                {ratingEntries
                  .filter((r) => r.comment)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-[#3A3A38]/10 bg-white/50 p-6 backdrop-blur-sm"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#3A3A38]">
                          {entry.commenter_name || "Anonymous"}
                        </span>
                        <StarRatingDisplay average={entry.rating} count={1} />
                      </div>
                      <p className="text-sm leading-relaxed text-[#3A3A38]/75">{entry.comment}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

      </article>

      <Navbar />
    </main>
  );
}