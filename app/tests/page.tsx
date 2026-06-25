import { client } from "../../lib/sanity";
import Navbar from "../../components/Navbar";
import Link from "next/link";

export default async function ToolsPage() {
  // Fetch tools and respect the drag-and-drop order from Sanity
  const tools = await client.fetch(`*[_type == "tool"] | order(orderRank)`);

  return (
    <main className="relative isolate min-h-screen text-[#3A3A38]">
      
      {/* 1. CINEMATIC VIDEO BACKGROUND */}
      <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none">
        <video className="h-full w-full object-cover opacity-80" autoPlay muted loop playsInline>
          <source src="/videos/aurora.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay to ensure text remains readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A5F]/60 via-[#FBF8F2]/80 to-[#FBF8F2]" />
      </div>

      <Navbar />
      
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-32">
        {/* Header */}
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

        {/* Tools Carousel/Grid */}
        {tools.length === 0 ? (
          <div className="text-center py-20 text-[#3A3A38]/60 font-medium bg-white/40 rounded-3xl backdrop-blur-sm border border-white/20">
            No tools available at the moment. Check back soon!
          </div>
        ) : (
          <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8 hide-scrollbar">
            {tools.map((tool: any) => (
              <div 
                key={tool._id} 
                className="flex min-w-[300px] sm:min-w-[350px] snap-start flex-col overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white/70 backdrop-blur-md shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="p-8 flex flex-col h-full">
                  <h3 className="font-serif text-2xl text-[#2C4C5B] mb-3">{tool.title}</h3>
                  <p className="text-sm text-[#3A3A38]/80 line-clamp-4 leading-relaxed flex-1">
                    {tool.description}
                  </p>
                  {tool.link && (
                    <Link 
                      href={tool.link} 
                      target="_blank" 
                      className="mt-8 inline-block text-center rounded-full bg-[#4F6F52] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-transform hover:-translate-y-1 hover:shadow-md"
                    >
                      Access Tool
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