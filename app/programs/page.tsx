"use client";

import { useState, useEffect, useRef } from "react";
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
}

export default function ProgramsPage() {
  const heroRef = useRef<HTMLElement>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [paidCounts, setPaidCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    sop: "",
  });

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;
    setIsSubmitting(true);
    setStatusMessage("Submitting your application...");

    const payload = {
      program_id: selectedProgram._id,
      program_title: selectedProgram.title,
      program_type: selectedProgram._type,
      applicant_name: formData.name,
      applicant_email: formData.email,
      // Note: We are passing phone inside SOP if the API doesn't explicitly extract it, 
      // or you can update the /api/applications/submit route to accept phone.
      statement_of_purpose: `Phone: ${formData.phone}\n\n${formData.sop}`,
    };

    try {
      // SECURE: Routing through the server-side endpoint instead of the client DB
      const res = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit application");

      setStatusMessage(
        "Success! Your application is under review. We will email you shortly."
      );
      setTimeout(() => {
        setFormData({ name: "", email: "", phone: "", sop: "" });
        setSelectedProgram(null);
        setStatusMessage("");
      }, 4000);
    } catch (error) {
      console.error(error);
      setStatusMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      {/* ── HERO with video background ──────────────────────────────── */}
      {/* FIX: video placed directly in the section, no wrapper div,
          no explicit z-index — DOM order (video → overlay → text) handles
          stacking without any fight with the body background colour. */}
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

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1C20]/50 via-[#1A1C20]/30 to-[#FBF8F2]" />

        {/* Hero text */}
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

              return (
                <div
                  key={program._id}
                  className="flex flex-col justify-between overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white/60 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  {/* ── FIX: Sanity thumbnail image ── */}
                  {program.image ? (
                    <div className="relative h-52 w-full overflow-hidden">
                      <Image
                        src={urlFor(program.image).width(800).height(416).fit("crop").url()}
                        alt={program.title}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  ) : (
                    // Thin accent bar when no image uploaded
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
                    <button
                      onClick={() => !isComingSoon && setSelectedProgram(program)}
                      disabled={isComingSoon}
                      className={`rounded-full px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors ${
                        isComingSoon
                          ? "bg-[#3A3A38]/30 cursor-not-allowed"
                          : isWaitlist
                          ? "bg-[#A65D47] hover:bg-[#A65D47]/80"
                          : "bg-[#2C4C5B] hover:bg-[#1E3A5F]"
                      }`}
                   >
                      {isComingSoon ? "Coming Soon" : isWaitlist ? "Join Waitlist" : "Apply Now"}
                   </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── APPLICATION MODAL ───────────────────────────────────────── */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A38]/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-[#FBF8F2] p-8 shadow-2xl">
            <button
              onClick={() => setSelectedProgram(null)}
              className="absolute right-6 top-6 text-[#3A3A38]/50 hover:text-[#3A3A38]"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mb-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#88B7B5]">
                Application Form
              </span>
              <h2 className="mt-2 font-serif text-3xl font-medium text-[#2C4C5B]">
                {selectedProgram.title}
              </h2>
              <p className="mt-2 text-sm text-[#3A3A38]/70">
                {(paidCounts[selectedProgram._id] || 0) >=
                selectedProgram.totalPositions
                  ? "This program is currently full. Join the waitlist and we will notify you if a seat opens up!"
                  : "Submit your application for review. You will not be charged until you are accepted."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                  Statement of Purpose
                </label>
                <textarea
                  name="sop"
                  required
                  rows={4}
                  value={formData.sop}
                  onChange={handleChange}
                  placeholder="Why are you interested in this program?"
                  className="w-full resize-none rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full rounded-full bg-[#2C4C5B] py-4 text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-1 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
              {statusMessage && (
                <p
                  className={`text-center text-sm font-medium ${
                    statusMessage.includes("Success")
                      ? "text-[#4F6F52]"
                      : "text-red-500"
                  }`}
                >
                  {statusMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  );
}