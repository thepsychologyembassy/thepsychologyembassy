import { client, urlFor } from "../../lib/sanity";
import { PortableText } from "@portabletext/react";
import Navbar from "../../components/Navbar";
import Image from "next/image";

export const revalidate = 60; // Revalidate cache every 60 seconds

export default async function EventsPage() {
  const initiatives = await client.fetch(`*[_type == "initiative"] | order(orderRank)`);

  return (
    <main className="relative isolate min-h-screen text-[#FBF8F2]">
      
      {/* APOLLO 13 LUNAR BACKGROUND */}
      <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none bg-black">
        <video className="h-full w-full object-cover" autoPlay muted loop playsInline>
          <source src="/videos/field-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/90" />
      </div>

      <Navbar />
      
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-32 pt-32 sm:pt-40">
        <div className="mb-20 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-[#CFE3E8] opacity-80">
            Community & Outreach
          </p>
          <h1 className="font-serif text-4xl font-medium tracking-wide sm:text-6xl drop-shadow-lg">
            Events & Initiatives
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-sm leading-relaxed text-[#FBF8F2]/70">
            Discover our continuous efforts to bring psychological awareness, community support, and clinical excellence out of the clinic and into the real world.
          </p>
        </div>

        <div className="flex flex-col gap-24">
          {initiatives.map((init: any, idx: number) => (
            <div key={init._id} className="group relative flex flex-col gap-10 lg:flex-row lg:items-start">
              
              {/* IMAGE SIDE */}
              {init.logo && (
                <div className={`relative w-full lg:w-5/12 aspect-square md:aspect-video lg:aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm ${idx % 2 !== 0 ? 'lg:order-last' : ''}`}>
                  <Image
                    src={urlFor(init.logo).url()}
                    alt={init.title || "Initiative Logo"}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}

              {/* CONTENT SIDE */}
              <div className="w-full lg:w-7/12 flex flex-col justify-center">
                <h2 className="mb-6 font-serif text-3xl sm:text-4xl">{init.title}</h2>
                
                <div className="prose prose-invert prose-sm max-w-none text-[#FBF8F2]/80 leading-relaxed mb-8">
                  <PortableText value={init.body} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white/10 pt-8">
                  {init.vision && (
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#88B7B5]">Vision</h4>
                      <p className="text-sm text-[#FBF8F2]/70">{init.vision}</p>
                    </div>
                  )}
                  {init.mission && (
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#88B7B5]">Mission</h4>
                      <p className="text-sm text-[#FBF8F2]/70">{init.mission}</p>
                    </div>
                  )}
                </div>

                {init.offerings && init.offerings.length > 0 && (
                  <div className="mt-8">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#CFE3E8]">Key Offerings</h4>
                    <div className="flex flex-wrap gap-2">
                      {init.offerings.map((offering: string, i: number) => (
                        <span key={i} className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs text-[#FBF8F2]/90">
                          {offering}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}