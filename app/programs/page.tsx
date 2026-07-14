"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { client, urlFor } from "../../lib/sanity";
import Navbar from "../../components/Navbar";

interface Program {
  _id: string;
  _type: string;
  title: string;
  description: string;
  duration?: string;
  price: number;
  totalPositions: number;
  image?: any;
  isComingSoon?: boolean;
  provider?: string; // "Internal" | "External"
  externalLink?: string;
  slug?: { current: string };
}

export default function ProgramsPage() {
  const heroRef = useRef<HTMLElement>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [paidCounts, setPaidCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgramsAndInventory = async () => {
      try {
        const fetchedPrograms = await client.fetch(
          `*[_type in ["course", "internship"] && isActive == true] | order(orderRank)`
        );
        setPrograms(fetchedPrograms);

        const { data: applications, error } = await supabase
          .from("program_applications")
          .select("program_id")
          .in("status", ["paid", "accepted"]);

        if (applications && !error) {
          const counts: Record<string, number> = {};
          applications.forEach((app) => {
            counts[app.program_id] = (counts[app.program_id] || 0) + 1;
          });
          setPaidCounts(counts);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgramsAndInventory();
  }, []);

  return (
    <main className="relative min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      {/* ── HERO with video background ──────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative h-[100vh] w-full overflow-hidden bg-[#1A1C20]"
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/videos/mountain-climb.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1C20]/50 via-[#1A1C20]/30 to-[#FBF8F2]" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.35em] text-[#CFE3E8]">
            Education & Growth
          </p>
          <h1 className="font-serif text-4xl font-medium text-[#FBF8F2] drop-shadow-[0_2px_18px_rgba(0,0,0,0.4)] sm:text-6xl">
            Courses & Internships
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[#CFE3E8]/80">
            Advance your career in psychology with our certified courses and
            hands-on clinical internships.
          </p>
        </div>
      </section>

      {/* ── PROGRAMS LISTING ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">
              Syncing Live Inventory...
            </p>
          </div>
        ) : programs.length === 0 ? (
          <div className="py-20 text-center text-[#3A3A38]/60">
            No programs are currently accepting applications. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {programs.map((program) => {
              const takenSeats = paidCounts[program._id] || 0;
              const seatsLeft = program.totalPositions - takenSeats;
              const isWaitlist = seatsLeft <= 0;
              const isComingSoon = program.isComingSoon === true;
              const isExternal = program.provider === "External";

              const cardContent = (
                <>
                  {program.image ? (
                    <div className="relative h-52 w-full overflow-hidden">
                      <Image
                        src={urlFor(program.image).width(800).height(416).fit("crop").url()}
                        alt={program.title}
                        fill
                        className={`object-cover ${
                          isComingSoon
                            ? "grayscale opacity-80"
                            : "transition-transform duration-500 group-hover:scale-105"
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="h-1.5 w-full bg-gradient-to-r from-[#88B7B5] via-[#4F6F52] to-[#88B7B5]" />
                  )}

                  <div className="p-8">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-full bg-[#88B7B5]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#2C4C5B]">
                        {program._type === "course"
                          ? "Certification Course"
                          : "Clinical Internship"}
                      </span>
                      {isComingSoon ? (
                        <span className="text-xs font-bold uppercase tracking-widest text-[#F6D86B]">
                          Coming Soon
                        </span>
                      ) : isExternal ? (
                        <span className="text-xs font-bold uppercase tracking-widest text-[#88B7B5]">
                          External
                        </span>
                      ) : isWaitlist ? (
                        <span className="text-xs font-bold uppercase tracking-widest text-[#A65D47]">
                          Waitlist Open
                        </span>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-widest text-[#4F6F52]">
                          {seatsLeft} Seats Left
                        </span>
                      )}
                    </div>

                    <h2 className="mb-3 font-serif text-2xl font-medium text-[#2C4C5B]">
                      {program.title}
                    </h2>
                    {program.duration && (
                      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                        Duration: {program.duration}
                      </p>
                    )}
                    <p className="line-clamp-3 text-sm leading-relaxed text-[#3A3A38]/70">
                      {program.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#3A3A38]/10 bg-white/50 p-8">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                        Enrollment Fee
                      </p>
                      <p className="font-serif text-2xl font-medium text-[#4F6F52]">
                        {program.price === 0
                          ? "Free"
                          : `₹${program.price.toLocaleString()}`}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors ${
                        isComingSoon
                          ? "bg-[#3A3A38]/30 cursor-not-allowed"
                          : isWaitlist
                          ? "bg-[#A65D47] group-hover:bg-[#A65D47]/80"
                          : "bg-[#2C4C5B] group-hover:bg-[#1E3A5F]"
                      }`}
                    >
                      {isComingSoon
                        ? "Coming Soon"
                        : isExternal
                        ? "Apply on Partner Site"
                        : isWaitlist
                        ? "Join Waitlist"
                        : "Apply Now"}
                    </span>
                  </div>
                </>
              );

              // Coming Soon → plain, non-interactive card
              if (isComingSoon) {
                return (
                  <div
                    key={program._id}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white/60 shadow-sm backdrop-blur-xl opacity-60 select-none"
                  >
                    {cardContent}
                  </div>
                );
              }

              // No slug yet (shouldn't happen post-migration, but stay safe)
              if (!program.slug?.current) {
                return (
                  <div
                    key={program._id}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white/60 shadow-sm backdrop-blur-xl opacity-60"
                  >
                    {cardContent}
                  </div>
                );
              }

              // External → opens the partner's link directly in a new tab
              if (isExternal && program.externalLink) {
                return (
                  <a
                    key={program._id}
                    href={program.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white/60 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    {cardContent}
                  </a>
                );
              }

              // Normal → navigates to the program's own page
              return (
                <Link
                  key={program._id}
                  href={`/programs/${program.slug.current}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white/60 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}