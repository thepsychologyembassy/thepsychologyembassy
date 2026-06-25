"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import Navbar from "../../../components/Navbar";
import { client, urlFor } from "../../../lib/sanity";

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
        
      </article>

      <Navbar />
    </main>
  );
}