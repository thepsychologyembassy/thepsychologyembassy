"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../../../components/Navbar";
import { client, urlFor } from "../../../lib/sanity";
import { supabase } from "../../../lib/supabase";

export default function ProgramDetailsPage() {
  const params = useParams<{ slug: string }>();

  const [program, setProgram] = useState<any>(null);
  const [seatsTaken, setSeatsTaken] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    sop: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProgram = async () => {
      if (!params?.slug) return;
      try {
        const data = await client.fetch(
          `*[_type in ["course", "internship"] && slug.current == $slug][0]`,
          { slug: params.slug }
        );
        setProgram(data);

        if (data?._id) {
          const { count } = await supabase
            .from("program_applications")
            .select("*", { count: "exact", head: true })
            .eq("program_id", data._id)
            .in("status", ["paid", "accepted"]);
          setSeatsTaken(count || 0);
        }

        // External programs skip our form entirely — send the visitor
        // straight to the partner's application page.
        if (data?.provider === "External" && data?.externalLink) {
          window.location.replace(data.externalLink);
          return;
        }
      } catch (error) {
        console.error("Error fetching program:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgram();
  }, [params?.slug]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleCustomChange = (question: string, answer: string) => {
    setCustomAnswers((prev) => ({ ...prev, [question]: answer }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program) return;

    if (!resumeFile) {
      setStatusMessage("Please attach your resume in PDF format.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Uploading resume...");

    try {
      const fileExt = resumeFile.name.split(".").pop();
      const secureFileName = `${self.crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(secureFileName, resumeFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(secureFileName);

      const finalResumeLink = publicUrlData.publicUrl;

      setStatusMessage("Submitting application securely...");

      const hasCustomQuestions =
        program.customQuestions && program.customQuestions.length > 0;

      const sopBody = hasCustomQuestions
        ? Object.entries(customAnswers)
            .map(([q, a]) => `Q: ${q}\nA: ${a}`)
            .join("\n\n")
        : formData.sop;

      const payload = {
        program_id: program._id,
        program_title: program.title,
        program_type: program._type,
        applicant_name: formData.name,
        applicant_email: formData.email,
        statement_of_purpose: `Phone: ${formData.phone}\n\n${sopBody}`,
        resume_link: finalResumeLink,
      };

      const res = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Server rejected application");

      setStatusMessage("Success! Your application has been submitted.");
      setFormData({ name: "", email: "", phone: "", sop: "" });
      setResumeFile(null);
      setCustomAnswers({});

      const fileInput = document.getElementById("resume-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error(error);
      setStatusMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBF8F2]">
        <p className="text-[#3A3A38]/60 animate-pulse uppercase tracking-widest text-sm">
          Loading Program...
        </p>
      </main>
    );
  }

  if (!program) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBF8F2]">
        <h1 className="text-[#2C4C5B] text-2xl font-serif">Program Not Found</h1>
      </main>
    );
  }

  // External programs redirect away in the effect above — show a brief
  // holding state in case the redirect hasn't fired yet.
  if (program.provider === "External" && program.externalLink) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBF8F2]">
        <p className="text-[#3A3A38]/60 animate-pulse uppercase tracking-widest text-sm">
          Redirecting to partner site...
        </p>
      </main>
    );
  }

  const isComingSoon = program.isComingSoon === true;
  const seatsLeft = program.totalPositions - seatsTaken;
  const isWaitlist = seatsLeft <= 0;

  return (
    <main className="relative min-h-screen bg-[#FBF8F2] text-[#3A3A38] pb-32 pt-24 sm:pt-32">
      <Navbar />

      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <Link
          href="/programs"
          className="mb-12 group flex w-fit items-center gap-2 text-sm font-medium uppercase tracking-widest text-[#3A3A38]/60 transition-colors hover:text-[#2C4C5B]"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>{" "}
          Back to Programs
        </Link>

        {program.image && (
          <div className="relative mb-10 h-64 w-full overflow-hidden rounded-3xl">
            <Image
              src={urlFor(program.image).width(1000).height(500).fit("crop").url()}
              alt={program.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-12">
          <div className="mb-4 flex flex-wrap gap-3">
            <span className="rounded-full bg-[#88B7B5]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#2C4C5B]">
              {program._type === "course" ? "Certification Course" : "Clinical Internship"}
            </span>
            {isComingSoon ? (
              <span className="rounded-full bg-[#F6D86B]/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#8a7328]">
                Coming Soon
              </span>
            ) : isWaitlist ? (
              <span className="rounded-full bg-[#A65D47]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#A65D47]">
                Waitlist Open
              </span>
            ) : (
              <span className="rounded-full bg-[#4F6F52]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#4F6F52]">
                {seatsLeft} Seats Left
              </span>
            )}
          </div>
          <h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl mb-4 text-[#2C4C5B]">
            {program.title}
          </h1>
          <p className="text-lg text-[#3A3A38]/70 leading-relaxed mb-6">
            {program.description}
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-[#3A3A38]/60">
            {program.duration && <span>Duration: {program.duration}</span>}
            <span>
              Enrollment Fee:{" "}
              {program.price === 0 ? "Free" : `₹${program.price.toLocaleString()}`}
            </span>
          </div>
        </header>

        {isComingSoon ? (
          <div className="rounded-3xl border border-[#3A3A38]/10 bg-white/40 p-12 text-center">
            <p className="text-[#3A3A38]/60 text-sm uppercase tracking-widest">
              Applications for this program haven&apos;t opened yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#3A3A38]/10 bg-white/60 p-8 backdrop-blur-xl sm:p-12">
            <h2 className="font-serif text-2xl mb-2 text-[#2C4C5B]">Application Form</h2>
            <p className="mb-8 text-sm text-[#3A3A38]/70">
              {isWaitlist
                ? "This program is currently full. Join the waitlist and we will notify you if a seat opens up!"
                : "Submit your application for review. You will not be charged until you are accepted."}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
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
                    className="w-full border-b border-[#3A3A38]/20 bg-transparent py-2 text-[#2C4C5B] transition-colors focus:border-[#4F6F52] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border-b border-[#3A3A38]/20 bg-transparent py-2 text-[#2C4C5B] transition-colors focus:border-[#4F6F52] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border-b border-[#3A3A38]/20 bg-transparent py-2 text-[#2C4C5B] transition-colors focus:border-[#4F6F52] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2 mt-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                    Upload Resume (PDF)
                  </label>
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf"
                    required
                    onChange={handleFileChange}
                    className="w-full text-sm text-[#3A3A38]/80 file:mr-4 file:rounded-full file:border-0 file:bg-[#3A3A38]/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-widest file:text-[#2C4C5B] hover:file:bg-[#3A3A38]/20 transition-colors cursor-pointer"
                  />
                </div>
              </div>

              {program.customQuestions && program.customQuestions.length > 0 ? (
                <div className="flex flex-col gap-8 border-t border-[#3A3A38]/10 pt-8">
                  {program.customQuestions.map((q: string, i: number) => (
                    <div key={i} className="flex flex-col gap-3">
                      <label className="text-sm font-medium leading-relaxed text-[#3A3A38]/80">
                        {q}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={customAnswers[q] || ""}
                        onChange={(e) => handleCustomChange(q, e.target.value)}
                        className="w-full resize-none rounded-xl border border-[#3A3A38]/20 bg-white/50 p-4 text-[#2C4C5B] transition-colors focus:border-[#4F6F52] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 border-t border-[#3A3A38]/10 pt-8">
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
                    className="w-full resize-none rounded-xl border border-[#3A3A38]/20 bg-white/50 p-4 text-[#2C4C5B] transition-colors focus:border-[#4F6F52] focus:outline-none"
                  />
                </div>
              )}

              <div className="mt-4 flex flex-col items-end gap-4 border-t border-[#3A3A38]/10 pt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-[#2C4C5B] px-8 py-3 text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-1 hover:shadow-lg focus:outline-none disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Submit Application"}
                </button>
                {statusMessage && (
                  <p
                    className={`text-sm font-medium ${
                      statusMessage.includes("Success") ? "text-[#4F6F52]" : "text-red-500"
                    }`}
                  >
                    {statusMessage}
                  </p>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}