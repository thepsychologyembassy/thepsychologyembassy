"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { client, urlFor } from "../../lib/sanity";
import Navbar from "../../components/Navbar";

interface Counselor {
  _id: string;
  name: string;
  email: string;
  designation: string;
  speciality?: string; 
  experience: string;
  sessionsCompleted?: string;
  languages: string;
  mode: string;
  fees: number;
  bio: string;
  image: any;
  shiftStart?: number;
  shiftEnd?: number;
  blockedDates?: string[];
}

interface Testimonial {
  _id: string;
  quote: string;
  name: string;
}

// Privacy Helper: Converts "Jane Doe" to "J. D."
const anonymizeName = (name: string) => {
  if (!name) return "Anonymous Client";
  return name.split(" ").map(n => n[0]).join(". ") + ".";
};

export default function BookPage() {
  const router = useRouter();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isRouting, setIsRouting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUser(user);
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsAuthChecking(false);
      }

      try {
        const fetchedCounselors = await client.fetch(`*[_type == "counselor"] | order(orderRank)`);
        const fetchedTestimonials = await client.fetch(`*[_type == "testimonial"] | order(orderRank)`);
        setCounselors(fetchedCounselors);
        setTestimonials(fetchedTestimonials);
      } catch (error) {
        console.error("Error fetching Sanity data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsAuthChecking(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => setCurrentIndex((prev) => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, [currentIndex, testimonials.length]);

  // Order the designation groups: Clinical Psychologists first, everything else in
  // the middle (alphabetical), and Counseling/Counselling Psychologists last.
  const groupedCounselorsRaw = counselors.reduce((acc, counselor) => {
    const title = counselor.designation || "Counselor";
    (acc[title] = acc[title] || []).push(counselor);
    return acc;
  }, {} as Record<string, Counselor[]>);

  const designationRank = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("clinical")) return 0;
    if (t.includes("counsel")) return 2; // covers "Counseling" and "Counselling"
    return 1;
  };

  const groupedCounselors = Object.fromEntries(
    Object.entries(groupedCounselorsRaw).sort(([a], [b]) => {
      const rankDiff = designationRank(a) - designationRank(b);
      return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
    })
  );

  const getVisibleTestimonials = () => {
    if (testimonials.length === 0) return [];
    if (testimonials.length === 1) return [testimonials[0]];
    return [testimonials[currentIndex], testimonials[(currentIndex + 1) % testimonials.length]];
  };

  // Smart CTA: resumes an in-progress intake session instead of starting over.
  const handleBookAppointment = async () => {
    if (!user) {
      router.push("/login?redirect=/book/intake");
      return;
    }

    setIsRouting(true);
    // Look at the user's most recent intake session regardless of status.
    // Previously this excluded "converted" sessions (already-booked ones),
    // which meant anyone who'd booked before was forced through a brand new
    // intake form every single time. Now: a draft resumes the form, and a
    // matched/converted session takes them straight back to their top-3
    // matches (reselect=1) - the same pathway the dashboard's "No, I don't
    // want to continue with this psychologist" button already uses - so
    // returning users always see their full top-3 again instead of either
    // redoing intake or being stuck with one psychologist.
    const { data: existing } = await supabase
      .from("intake_sessions")
      .select("id, status")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      if (existing.status === "draft") {
        router.push(`/book/intake?session=${existing.id}`);
      } else {
        router.push(`/book/match?session=${existing.id}&reselect=1`);
      }
      return;
    }

    router.push("/book/intake");
  };

  return (
    <main className="relative isolate min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      {/* 1. HERO */}
      <section className="relative h-[50vh] w-full overflow-hidden sm:h-[70vh]">
        <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none">
          <video className="h-full w-full object-cover" autoPlay muted loop playsInline>
            <source src="/videos/beach-waves.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-20 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.35em] text-black drop-shadow-sm">Find Your Calm</p>
          <h1 className="max-w-4xl font-serif text-4xl font-medium leading-tight text-black sm:text-6xl">A Safe Harbor.</h1>
        </div>
      </section>

      {/* 2. DYNAMIC COUNSELORS SECTION (3-COLUMN GRID, CLINICAL FIRST) */}
      <section className="relative z-10 mx-auto -mt-10 w-full max-w-6xl px-6 pb-24 sm:-mt-20">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-3xl font-medium text-black sm:text-4xl">Meet Our Team</h2>
          <p className="mt-4 text-sm uppercase tracking-widest text-black/60">Find the right specialist to guide your journey.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">Loading Profiles...</p></div>
        ) : (
          <div className="flex flex-col gap-16">
            {Object.entries(groupedCounselors).map(([designation, list]) => (
              <div key={designation}>
                <h3 className="mb-6 border-b border-[#3A3A38]/10 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-black">
                  {designation}s
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {list.map(c => (
                    <div key={c._id} className="flex flex-col overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                      <div className="relative h-48 w-full bg-[#88B7B5]/20">
                        {c.image && <Image src={urlFor(c.image).url()} alt={c.name} fill className="object-contain p-2" />}
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <h4 className="font-serif text-xl font-medium text-black">{c.name}</h4>
                        
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {c.experience && (
                            <span className="flex items-center rounded-md bg-[#88B7B5]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#2C4C5B]">
                              {c.experience} Yrs Exp
                            </span>
                          )}
                          {c.sessionsCompleted && (
                            <span className="flex items-center rounded-md bg-[#F6D86B]/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#8E7A65]">
                              {c.sessionsCompleted} Sessions
                            </span>
                          )}
                          {c.speciality && (
                            <span className="flex items-center rounded-md bg-[#4F6F52]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#4F6F52]">
                              {c.speciality}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-[#3A3A38]/70 line-clamp-3">{c.bio}</p>
                        
                        <div className="mt-6 flex items-center justify-between border-t border-[#3A3A38]/10 pt-4">
                          <p className="text-sm font-semibold text-[#4F6F52]">₹{c.fees}/hr</p>
                          <Link href={`/counselors/${c._id}`} className="rounded-full border border-[#2C4C5B]/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#2C4C5B] transition-colors hover:bg-[#2C4C5B] hover:text-white">
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. START THE INTAKE FLOW */}
      <section id="booking-form" className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl border border-[#88B7B5]/30 bg-white/60 shadow-[0_8px_40px_rgba(44,76,91,0.05)] backdrop-blur-xl">
          <div className="border-b border-[#88B7B5]/20 bg-[#88B7B5]/10 px-8 py-8 sm:px-12">
            <h2 className="font-serif text-2xl font-medium text-black">Ready to Begin?</h2>
            <p className="mt-2 text-sm text-[#3A3A38]/70">
              We&apos;ll ask a few short questions and match you with the 3 psychologists best suited to help—including at least one Clinical Psychologist.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 px-8 py-14 text-center sm:px-12">
            {isAuthChecking ? (
              <p className="animate-pulse text-sm font-medium uppercase tracking-[0.35em] text-[#88B7B5]">Verifying Secure Session...</p>
            ) : !user ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#88B7B5]/20 text-[#2C4C5B]">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <h3 className="font-serif text-2xl font-medium text-black">Authentication Required</h3>
                <p className="max-w-md text-sm text-[#3A3A38]/70">To ensure your privacy and secure your appointment slots, please log in or create an account to continue.</p>
                <div className="flex gap-4">
                  <Link href="/login?redirect=/book/intake" className="rounded-full bg-[#2C4C5B] px-8 py-3 text-sm font-medium tracking-wide text-[#FBF8F2] transition-transform hover:-translate-y-1 hover:shadow-lg">
                    Log In
                  </Link>
                  <Link href="/signup?redirect=/book/intake" className="rounded-full border border-[#2C4C5B] px-8 py-3 text-sm font-medium tracking-wide text-[#2C4C5B] transition-colors hover:bg-[#2C4C5B]/5">
                    Sign Up
                  </Link>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBookAppointment}
                  disabled={isRouting}
                  className="rounded-full bg-[#2C4C5B] px-10 py-4 text-sm font-medium tracking-wide text-[#FBF8F2] transition-transform hover:-translate-y-1 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRouting ? "Loading..." : "Book Appointment"}
                </button>
                <p className="text-xs text-[#3A3A38]/50">Takes about 3 minutes.</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4. ANONYMIZED TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="relative z-10 w-full bg-[#4F6F52]/5 px-6 py-24 sm:px-12">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="mb-12 font-serif text-3xl font-medium text-black">Stories of Growth</h2>
            
            <div className="block sm:hidden">
              <div className="flex flex-col items-center rounded-3xl border border-[#3A3A38]/10 bg-white p-8 shadow-sm">
                <span className="mb-4 font-serif text-5xl text-[#88B7B5]">"</span>
                <p className="mb-6 text-sm italic leading-relaxed text-[#3A3A38]/80">{testimonials[currentIndex].quote}</p>
                {/* Applied Confidentiality Filter */}
                <p className="font-semibold tracking-widest text-black">{anonymizeName(testimonials[currentIndex].name)}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#3A3A38]/50 mt-1">Verified Client</p>
              </div>
            </div>

            <div className="hidden sm:grid sm:grid-cols-2 sm:gap-8">
              {getVisibleTestimonials().map((test, i) => (
                <div key={`${test._id}-${i}`} className="flex flex-col items-center justify-between rounded-3xl border border-[#3A3A38]/10 bg-white p-10 shadow-sm transition-opacity duration-500">
                  <div className="flex flex-col items-center">
                    <span className="mb-4 font-serif text-6xl text-[#88B7B5]/60">"</span>
                    <p className="mb-6 text-lg italic leading-relaxed text-[#3A3A38]/80">{test.quote}</p>
                  </div>
                  <div className="text-center">
                    {/* Applied Confidentiality Filter */}
                    <p className="text-sm font-semibold uppercase tracking-widest text-black">{anonymizeName(test.name)}</p>
                    <p className="text-[10px] uppercase tracking-widest text-[#3A3A38]/50 mt-1">Verified Client</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

    </main>
  );
}