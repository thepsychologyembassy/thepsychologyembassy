"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { client } from "../../../lib/sanity";
import { supabase } from "../../../lib/supabase";

export default function CourseDetailsPage() {
  const params = useParams<{ slug: string }>();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [formData, setFormData] = useState({
    fullName: "", email: "", linkedin: "",
  });
  
  // NEW: State to hold the physical PDF file
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCourse = async () => {
      if (!params?.slug) return;
      try {
        const data = await client.fetch(
          `*[_type == "course" && slug.current == $slug][0]`,
          { slug: params.slug }
        );
        setCourse(data);
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [params?.slug]);

  const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // NEW: Handle the file upload selection
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
    setIsSubmitting(true);
    setStatusMessage("Uploading resume...");

    if (!resumeFile) {
      setStatusMessage("Please attach your resume in PDF format.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Upload the PDF to Supabase Storage
      const fileExt = resumeFile.name.split('.').pop();
      // Generate a random, unique name so files don't overwrite each other
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile);

      if (uploadError) throw uploadError;

      // 2. Get the public URL of the freshly uploaded PDF
      const { data: publicUrlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);
        
      const finalResumeLink = publicUrlData.publicUrl;

      setStatusMessage("Submitting application...");

      // 3. Save the application data to the database
      const payload = {
        course_name: course.title,
        full_name: formData.fullName,
        email: formData.email,
        linkedin_url: formData.linkedin,
        resume_link: finalResumeLink, // We save the Supabase File URL here!
        custom_answers: customAnswers,
      };

      const { error: dbError } = await supabase.from("applications").insert([payload]);

      if (dbError) throw dbError;

      setStatusMessage("Success! Your application has been submitted.");
      setFormData({ fullName: "", email: "", linkedin: "" });
      setResumeFile(null);
      setCustomAnswers({});
      
      // Reset the file input visually
      const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error) {
      console.error(error);
      setStatusMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <main className="flex min-h-screen items-center justify-center bg-[#1A1C20]"><p className="text-[#CFE3E8] animate-pulse uppercase tracking-widest text-sm">Loading Program...</p></main>;
  if (!course) return <main className="flex min-h-screen items-center justify-center bg-[#1A1C20]"><h1 className="text-white text-2xl font-serif">Program Not Found</h1></main>;

  return (
    <main className="relative min-h-screen bg-[#1A1C20] text-[#FBF8F2] pb-32 pt-24 sm:pt-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#CFE3E8]/5 via-[#1A1C20] to-[#1A1C20] pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <Link href="/courses" className="mb-12 group flex w-fit items-center gap-2 text-sm font-medium uppercase tracking-widest text-[#CFE3E8]/60 transition-colors hover:text-white">
          <span className="transition-transform group-hover:-translate-x-1">←</span> Back to Opportunities
        </Link>

        {/* Header */}
        <header className="mb-16">
          <div className="mb-4 flex gap-3">
            <span className="rounded-full bg-[#CFE3E8]/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-[#CFE3E8] border border-[#CFE3E8]/20">{course.type || "Program"}</span>
            <span className="rounded-full bg-[#4F6F52]/30 px-3 py-1 text-xs font-medium uppercase tracking-wider text-[#A3C4C3] border border-[#4F6F52]/40">Internal</span>
          </div>
          <h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl mb-4">{course.title}</h1>
          <p className="text-lg text-[#CFE3E8]/80 leading-relaxed">{course.description}</p>
        </header>

        {/* Application Form */}
        <div className="rounded-3xl border border-[#CFE3E8]/10 bg-white/5 p-8 backdrop-blur-xl sm:p-12">
          <h2 className="font-serif text-2xl mb-8 border-b border-[#CFE3E8]/10 pb-4">Application Form</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Standard Info */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-[#CFE3E8]/60">Full Name</label>
                <input type="text" name="fullName" required value={formData.fullName} onChange={handleBaseChange} className="w-full border-b border-[#CFE3E8]/20 bg-transparent py-2 text-white transition-colors focus:border-[#CFE3E8] focus:outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-[#CFE3E8]/60">Email Address</label>
                <input type="email" name="email" required value={formData.email} onChange={handleBaseChange} className="w-full border-b border-[#CFE3E8]/20 bg-transparent py-2 text-white transition-colors focus:border-[#CFE3E8] focus:outline-none" />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-[#CFE3E8]/60">LinkedIn Profile URL</label>
                <input type="url" name="linkedin" required value={formData.linkedin} onChange={handleBaseChange} className="w-full border-b border-[#CFE3E8]/20 bg-transparent py-2 text-white transition-colors focus:border-[#CFE3E8] focus:outline-none" />
              </div>
              
              {/* NEW: PDF File Upload Input */}
              <div className="flex flex-col gap-2 sm:col-span-2 mt-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-[#CFE3E8]/60">Upload Resume (PDF)</label>
                <input 
                  id="resume-upload"
                  type="file" 
                  accept=".pdf" 
                  required 
                  onChange={handleFileChange} 
                  className="w-full text-sm text-[#CFE3E8]/80 file:mr-4 file:rounded-full file:border-0 file:bg-[#CFE3E8]/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-widest file:text-[#CFE3E8] hover:file:bg-[#CFE3E8]/20 transition-colors cursor-pointer" 
                />
              </div>
            </div>

            {/* DYNAMIC QUESTIONS */}
            {course.customQuestions && course.customQuestions.length > 0 && (
              <div className="flex flex-col gap-8 border-t border-[#CFE3E8]/10 pt-8">
                {course.customQuestions.map((q: string, i: number) => (
                  <div key={i} className="flex flex-col gap-3">
                    <label className="text-sm font-medium leading-relaxed text-[#CFE3E8]/90">{q}</label>
                    <textarea 
                      required 
                      rows={3} 
                      value={customAnswers[q] || ""} 
                      onChange={(e) => handleCustomChange(q, e.target.value)} 
                      className="w-full resize-none rounded-xl border border-[#CFE3E8]/20 bg-black/20 p-4 text-white transition-colors focus:border-[#CFE3E8] focus:outline-none" 
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-col items-end gap-4 border-t border-[#CFE3E8]/10 pt-8">
              <button type="submit" disabled={isSubmitting} className="rounded-full bg-[#CFE3E8] px-8 py-3 text-sm font-semibold tracking-wide text-[#1A1C20] transition-transform hover:-translate-y-1 hover:shadow-lg focus:outline-none disabled:opacity-50">
                {isSubmitting ? "Processing..." : "Submit Application"}
              </button>
              {statusMessage && <p className={`text-sm font-medium ${statusMessage.includes("Success") ? "text-[#4F6F52]" : "text-[#CFE3E8]"}`}>{statusMessage}</p>}
            </div>

          </form>
        </div>
      </div>
      <Navbar />
    </main>
  );
}