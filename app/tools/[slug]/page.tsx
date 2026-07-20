import { client } from "../../../lib/sanity";
import { PortableText } from "@portabletext/react";
import Navbar from "../../../components/Navbar";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateStaticParams() {
  const tools = await client.fetch(
    `*[_type == "tool" && defined(slug.current)]{ "slugString": slug.current }`
  );

  return tools.map((tool: any) => ({
    slug: String(tool.slugString),
  }));
}

// Use 'any' for params to bypass strict TypeScript errors during the build
export default async function ToolDetailPage({ params }: { params: any }) {
  
  // BULLETPROOF PARAMS HANDLING: Await the params object before extracting the slug
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) {
    return notFound();
  }

  // Fetch tool data AND resolve the PDF asset URL in the same query
  const tool = await client.fetch(
    `*[_type == "tool" && slug.current == $slug][0]{
      ...,
      "pdfUrl": pdfFile.asset->url
    }`,
    { slug }
  );

  if (!tool) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
        <Link href="/tools" className="mb-8 inline-flex items-center text-xs font-bold uppercase tracking-widest text-[#88B7B5] hover:text-[#4F6F52] transition-colors">
          ← Back to All Tools
        </Link>

        <div className="rounded-3xl border border-[#3A3A38]/10 bg-white p-8 shadow-sm sm:p-12">
          
          <div className="mb-8 border-b border-[#3A3A38]/10 pb-8">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {tool.category && (
                <span className="rounded-full bg-[#88B7B5]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2C4C5B]">
                  {tool.category}
                </span>
              )}
              {tool.time && (
                <span className="text-xs font-semibold text-[#3A3A38]/50">
                  Estimated Time: {tool.time}
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl font-medium text-[#2C4C5B] sm:text-5xl mb-4">
              {tool.title}
            </h1>
            <p className="text-lg text-[#3A3A38]/70 italic">
              {tool.shortDescription}
            </p>
          </div>

          {/* Main Article Content — render nothing if not provided in Sanity */}
          {tool.detailedContent && (
            <div className="prose prose-lg max-w-none text-[#3A3A38]/85 leading-relaxed mb-12 prose-headings:font-serif prose-headings:text-[#2C4C5B] prose-a:text-[#4F6F52]">
              <PortableText value={tool.detailedContent} />
            </div>
          )}

          {/* Action Area: External Link or PDF Download */}
          {(tool.link || tool.pdfUrl) && (
            <div className="mt-12 flex flex-wrap gap-4 border-t border-[#3A3A38]/10 pt-8">
              {tool.pdfUrl && (
                <a 
                  href={tool.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-[#2C4C5B] px-8 py-4 text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Download PDF Worksheet
                </a>
              )}

              {tool.link && (
                <a 
                  href={tool.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border border-[#2C4C5B] px-8 py-4 text-sm font-semibold tracking-wide text-[#2C4C5B] transition-colors hover:bg-[#2C4C5B]/5"
                >
                  Access External Resource ↗
                </a>
              )}
            </div>
          )}

        </div>
      </section>
    </main>
  );
}