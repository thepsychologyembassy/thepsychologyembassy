"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Navbar from "../../../components/Navbar";
import { client } from "../../../lib/sanity";

// react-pdf touches browser-only APIs (canvas, DOMMatrix), so the reader
// must never be rendered during SSR.
const NewsletterReader = dynamic(() => import("../../../components/NewsletterReader"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[400px] items-center justify-center">
      <p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">Loading Newsletter...</p>
    </div>
  ),
});

interface NewsletterDoc {
  _id: string;
  title: string;
  publishedAt: string;
  excerpt?: string;
  pdfUrl?: string;
}

export default function NewsletterDetailPage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<NewsletterDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNewsletter = async () => {
      if (!params?.slug) return;
      try {
        const data = await client.fetch(
          `*[_type == "newsletter" && slug.current == $slug][0]{
            _id,
            title,
            publishedAt,
            excerpt,
            "pdfUrl": pdfFile.asset->url
          }`,
          { slug: params.slug }
        );
        setPost(data);
      } catch (error) {
        console.error("Error fetching newsletter:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNewsletter();
  }, [params?.slug]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBF8F2]">
        <p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">Loading Newsletter...</p>
      </main>
    );
  }

  if (!post || !post.pdfUrl) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FBF8F2] text-center">
        <h1 className="font-serif text-4xl text-[#3A3A38]">Newsletter not found</h1>
        <Link href="/newsletters" className="mt-6 border-b border-[#3A3A38] text-[#3A3A38]/60 pb-1 uppercase tracking-widest hover:text-[#3A3A38]">
          Return to Newsletters
        </Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#FBF8F2] text-[#3A3A38] pb-32 pt-24 sm:pt-32">
      <article className="mx-auto max-w-4xl px-6">
        {/* Navigation */}
        <div className="mb-12">
          <Link href="/newsletters" className="group flex w-fit items-center gap-2 text-sm font-medium uppercase tracking-widest text-[#3A3A38]/50 transition-colors hover:text-[#4F6F52]">
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            Back to Newsletters
          </Link>
        </div>

        {/* Header */}
        <header className="mb-12 text-center sm:mb-16">
          {post.publishedAt && (
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#88B7B5]">
              {formatDate(post.publishedAt)}
            </p>
          )}
          <h1 className="font-serif text-4xl font-medium leading-tight text-[#2C4C5B] sm:text-5xl md:text-6xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#3A3A38]/70">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Flip-through PDF reader + Download */}
        <NewsletterReader pdfUrl={post.pdfUrl} title={post.title} />
      </article>

      <Navbar />
    </main>
  );
}
