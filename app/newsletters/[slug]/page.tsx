import { client } from "../../../lib/sanity";
import Navbar from "../../../components/Navbar";
import Link from "next/link";
import { notFound } from "next/navigation";
import NewsletterReaderClient from "./NewsletterReaderClient";

export const revalidate = 60;

export async function generateStaticParams() {
  const newsletters = await client.fetch(
    `*[_type == "newsletter" && defined(slug.current)]{ "slugString": slug.current }`
  );

  return newsletters.map((n: any) => ({
    slug: String(n.slugString),
  }));
}

// Use 'any' for params to bypass strict TypeScript errors during the build
export default async function NewsletterDetailPage({ params }: { params: any }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) {
    return notFound();
  }

  const post = await client.fetch(
    `*[_type == "newsletter" && slug.current == $slug][0]{
      _id,
      title,
      publishedAt,
      excerpt,
      "pdfUrl": pdfFile.asset->url
    }`,
    { slug }
  );

  if (!post || !post.pdfUrl) {
    return notFound();
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-[#1c1c1b] text-[#FBF8F2]">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
        <Link
          href="/newsletters"
          className="mb-8 inline-flex items-center text-xs font-bold uppercase tracking-widest text-[#CFE3E8] transition-colors hover:text-white"
        >
          ← Back to the Archive
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:p-12">
          <div className="mb-10 border-b border-white/10 pb-8 text-center">
            {post.publishedAt && (
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#CFE3E8]/80">
                {formatDate(post.publishedAt)}
              </p>
            )}
            <h1 className="font-serif text-3xl font-medium sm:text-5xl">{post.title}</h1>
            {post.excerpt && (
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60">
                {post.excerpt}
              </p>
            )}
          </div>

          <NewsletterReaderClient pdfUrl={post.pdfUrl} title={post.title} />
        </div>
      </section>
    </main>
  );
}
