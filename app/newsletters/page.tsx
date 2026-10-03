import { client, urlFor } from "../../lib/sanity";
import Navbar from "../../components/Navbar";
import VideoBackground from "../../components/VideoBackground";
import NewsletterArchiveList from "./NewsletterArchiveList";

export const revalidate = 60;

export default async function NewslettersPage() {
  const newsletters = await client.fetch(
    `*[_type == "newsletter"] | order(orderRank) {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      isComingSoon,
      coverImage
    }`
  );

  return (
    <main className="relative isolate min-h-screen text-[#FBF8F2]">
      {/* BACKGROUND VIDEO */}
      <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none bg-black">
        <VideoBackground
          src="/videos/newsletter_video.mp4"
          poster="/videos/posters/newsletter.png"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/85 via-[#0a0a0a]/40 to-[#0a0a0a]/90" />
      </div>

      <Navbar />

      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-32 pt-32 sm:pt-40">
        <div className="mb-20 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-[#CFE3E8] opacity-80">
            The Archive
          </p>
          <h1 className="font-serif text-4xl font-medium tracking-wide sm:text-6xl drop-shadow-lg">
            Newsletters
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-sm leading-relaxed text-[#FBF8F2]/70">
            Every issue we have sent out, collected in one place. Open one to read it page by page, or download it to keep.
          </p>
        </div>

        <NewsletterArchiveList
          newsletters={newsletters.map((n: any) => ({
            ...n,
            coverImageUrl: n.coverImage ? urlFor(n.coverImage).width(400).height(520).url() : null,
          }))}
        />
      </section>
    </main>
  );
}
