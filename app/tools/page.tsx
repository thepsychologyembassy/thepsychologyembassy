import { client } from "../../lib/sanity";
import Navbar from "../../components/Navbar";
import ToolsGrid from "./ToolsGrid";

export const revalidate = 60;

export default async function ToolsPage() {
  const tools = await client.fetch(`*[_type == "tool"] | order(orderRank asc, _createdAt desc)`);

  return (
    <main className="relative isolate min-h-screen text-white">
      {/* BACKGROUND VIDEO */}
      <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none bg-black">
        <video className="h-full w-full object-cover" autoPlay muted loop playsInline>
          <source src="/videos/aurora.mp4" type="video/mp4" />
        </video>
      </div>
      
      <Navbar />
      
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-32">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.35em] text-white/90 drop-shadow-md">
            Resources
          </p>
          <h1 className="font-serif text-4xl font-medium text-white sm:text-5xl drop-shadow-lg">
            Tests & Tools
          </h1>
          <p className="mt-4 text-sm text-white/80 font-medium drop-shadow-md">
            Explore our curated collection of psychological resources and assessments.
          </p>
        </div>
        
        <ToolsGrid tools={tools} />
      </section>
    </main>
  );
}