import { client } from "../../lib/sanity";
import Navbar from "../../components/Navbar";
import Link from "next/link";

export const revalidate = 60;

export default async function ToolsPage() {
  const tools = await client.fetch(`*[_type == "tool"] | order(orderRank asc, _createdAt desc)`);

  return (
    <main className="relative isolate min-h-screen text-[#3A3A38]">
      <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none bg-[#FBF8F2]">
        <video className="h-full w-full object-cover opacity-80" autoPlay muted loop playsInline>
          <source src="/videos/aurora.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A5F]/60 via-[#FBF8F2]/80 to-[#FBF8F2]" />
      </div>

      <Navbar />
      
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-32">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.35em] text-[#FBF8F2] drop-shadow-md">
            Resources
          </p>
          <h1 className="font-serif text-4xl font-medium text-[#2C4C5B] sm:text-5xl drop-shadow-sm">
            Tests & Tools
          </h1>
          <p className="mt-4 text-sm text-[#3A3A38]/80 font-medium">
            Explore our curated collection of psychological resources and assessments.
          </p>
        </div>

        {!tools || tools.length === 0 ? (
          <div className="text-center py-20 text-[#3A3A38]/60 font-medium bg-white/40 rounded-3xl backdrop-blur-sm border border-white/20">
            No tools available at the moment. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool: any) => (
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
                  
                  {/* HIDE DESCRIPTION IF COMING SOON */}
                  {!tool.isComingSoon && (
                    <p className="text-sm text-[#3A3A38]/80 line-clamp-3 leading-relaxed flex-1">
                      {tool.shortDescription || "Click below to read more about this tool."}
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
      </section>
    </main>
  );
}