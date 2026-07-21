"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time calculations to activate link exactly 15 mins before
  const [currentTime, setCurrentTime] = useState(new Date());

  // NEW: Custom Modal States
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Homework submission upload state
  const [submittingAptId, setSubmittingAptId] = useState<string | null>(null);
  const [pendingSubmissionFiles, setPendingSubmissionFiles] = useState<File[]>([]);
  const [submissionFileError, setSubmissionFileError] = useState("");
  const [isUploadingSubmission, setIsUploadingSubmission] = useState(false);

  // Post-session feedback + "continue with this psychologist?" state
  const [feedbackByAptId, setFeedbackByAptId] = useState<Record<string, any>>({});
  const [activeFeedbackAptId, setActiveFeedbackAptId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [continuePromptAptId, setContinuePromptAptId] = useState<string | null>(null);

  const authHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  useEffect(() => {
    // Update the clock every minute so the 15-minute button activation is live
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Authenticate securely via server
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push("/login"); // Kick them out if not logged in
        return;
      }
      
      setUser(user);

      // 2. Fetch their specific PAID appointments
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_email", user.email)
        .eq("status", "paid") // STRICTLY ONLY PAID APPOINTMENTS
        .order("appointment_date", { ascending: true });

      if (!error && data) {
        setAppointments(data);

        // Pull any feedback already left for past sessions, so we don't
        // show the feedback form again once it's been submitted.
        const now = new Date();
        const pastApts = data.filter((apt: any) => {
          const endHour = Math.max(...(apt.time_slots || [0])) + 1;
          const end = new Date(apt.appointment_date);
          end.setHours(endHour, 0, 0, 0);
          return now >= end;
        });

        if (pastApts.length > 0) {
          try {
            const headers = await authHeader();
            const results = await Promise.all(
              pastApts.map((apt: any) =>
                fetch(`/api/feedback?appointmentId=${apt.id}`, { headers })
                  .then((r) => (r.ok ? r.json() : { feedback: null }))
                  .then((r) => [apt.id, r.feedback])
                  .catch(() => [apt.id, null])
              )
            );
            const map: Record<string, any> = {};
            results.forEach(([id, fb]) => {
              if (fb) map[id as string] = fb;
            });
            setFeedbackByAptId(map);
          } catch (err) {
            console.error("Failed to load feedback:", err);
          }
        }
      }
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // SECURE CANCELLATION EXECUTED FROM MODAL
  const confirmCancellation = async () => {
    if (!appointmentToCancel) return;
    setIsCancelling(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ appointmentId: appointmentToCancel })
      });

      const result = await res.json();

      if (res.ok) {
        alert("Session cancelled successfully. Your refund is on the way!");
        // Instantly remove the cancelled appointment from the UI without reloading
        setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentToCancel));
      } else {
        alert(result.error || "Failed to cancel session.");
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred. Please try again.");
    } finally {
      setIsCancelling(false);
      setAppointmentToCancel(null); // Close the modal
    }
  };

  // Helper to format 24hr array into human string
  const formatTimeRange = (slots: number[]) => {
    if (!slots || slots.length === 0) return "TBD";
    const startHour = Math.min(...slots);
    const endHour = Math.max(...slots) + 1; 
    
    const format = (h: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedH = h % 12 || 12;
      return `${formattedH < 10 ? '0' : ''}${formattedH}:00 ${ampm}`;
    };
    return `${format(startHour)} - ${format(endHour)}`;
  };

  const handleSubmissionFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || []);
    setSubmissionFileError("");
    if (chosen.length > 2) {
      setSubmissionFileError("You can upload at most 2 files.");
      return;
    }
    const tooBig = chosen.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      setSubmissionFileError(`"${tooBig.name}" is over 5MB. Please choose a smaller file.`);
      return;
    }
    setPendingSubmissionFiles(chosen);
  };

  const uploadHomeworkSubmission = async (aptId: string) => {
    if (pendingSubmissionFiles.length === 0) {
      setSubmissionFileError("Please choose at least one file.");
      return;
    }
    setIsUploadingSubmission(true);
    try {
      const headers = await authHeader();
      const formData = new FormData();
      formData.append("appointmentId", aptId);
      pendingSubmissionFiles.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/homework/submit", { method: "POST", headers, body: formData });
      const result = await res.json();

      if (res.ok) {
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === aptId ? { ...apt, homework_submission_files: result.homework_submission_files } : apt))
        );
        setSubmittingAptId(null);
        setPendingSubmissionFiles([]);
      } else {
        setSubmissionFileError(result.error || "Failed to upload. Please try again.");
      }
    } catch (err) {
      setSubmissionFileError("A network error occurred. Please try again.");
    } finally {
      setIsUploadingSubmission(false);
    }
  };

  const submitFeedback = async (apt: any) => {
    if (feedbackRating < 1) {
      alert("Please select a star rating.");
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: apt.id,
          rating: feedbackRating,
          feedbackText,
          // wantsToContinue is answered in the follow-up prompt; default to
          // true here and let the follow-up buttons correct/route it.
          wantsToContinue: true,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setFeedbackByAptId((prev) => ({ ...prev, [apt.id]: result.feedback }));
        setActiveFeedbackAptId(null);
        setFeedbackRating(0);
        setFeedbackText("");
        setContinuePromptAptId(apt.id); // show the Yes/No follow-up
      } else {
        alert(result.error || "Failed to submit feedback.");
      }
    } catch (err) {
      alert("A network error occurred. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const recordContinuePreference = async (apt: any, wantsToContinue: boolean) => {
    // Patch the feedback row with their actual answer.
    try {
      const headers = await authHeader();
      await fetch("/api/feedback", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: apt.id,
          rating: feedbackByAptId[apt.id]?.rating || 5,
          feedbackText: feedbackByAptId[apt.id]?.feedback_text || "",
          wantsToContinue,
        }),
      });
    } catch (err) {
      console.error("Failed to record continue preference:", err);
    }

    if (wantsToContinue) {
      router.push(`/book/match?counselor=${apt.counselor_id}&rebook=1`);
    } else if (apt.intake_session_id) {
      router.push(`/book/match?session=${apt.intake_session_id}&reselect=1`);
    } else {
      router.push("/book/intake");
    }
  };

  // For the "Book a Session" shortcut on the most recent session.
  const latestAppointment = appointments.length
    ? [...appointments].sort((a, b) => {
        const aEnd = new Date(a.appointment_date).getTime() + Math.max(...(a.time_slots || [0]));
        const bEnd = new Date(b.appointment_date).getTime() + Math.max(...(b.time_slots || [0]));
        return bEnd - aEnd;
      })[0]
    : null;

  // Sessions completed so far - counts paid appointments whose time slot has
  // already fully passed (same "isPast" logic used per-card below).
  const sessionsCompletedCount = appointments.filter((apt) => {
    const endHour = Math.max(...(apt.time_slots || [0])) + 1;
    const end = new Date(apt.appointment_date);
    end.setHours(endHour, 0, 0, 0);
    return currentTime >= end;
  }).length;

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 border-b border-[#3A3A38]/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.35em] text-[#88B7B5]">Patient Portal</p>
            <h1 className="font-serif text-4xl font-medium text-[#2C4C5B]">My Appointments</h1>
            {!isLoading && (
              <p className="mt-2 text-sm text-[#3A3A38]/60">
                Sessions completed so far:{" "}
                <span className="font-semibold text-[#4F6F52]">{sessionsCompletedCount}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {latestAppointment && (
              <button
                onClick={() => router.push(`/book/match?counselor=${latestAppointment.counselor_id}&rebook=1`)}
                className="rounded-full bg-[#4F6F52] px-6 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Book a Session
              </button>
            )}
            <button onClick={handleLogout} className="rounded-full border border-[#A65D47]/30 px-6 py-2 text-xs font-semibold uppercase tracking-widest text-[#A65D47] transition-colors hover:bg-[#A65D47]/5">
              Log Out
            </button>
          </div>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">Loading Schedule...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[#3A3A38]/10 bg-white/50 py-20 text-center shadow-sm">
            <h3 className="font-serif text-2xl text-[#3A3A38]">No Appointments Yet</h3>
            <p className="mt-2 text-[#3A3A38]/60">You have no upcoming scheduled sessions.</p>
            <button onClick={() => router.push("/book")} className="mt-6 rounded-full bg-[#4F6F52] px-8 py-3 text-sm font-medium tracking-wide text-white transition-transform hover:-translate-y-1 hover:shadow-lg">
              Book a Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {appointments.map((apt) => {
              // Time Math for Meeting Link Logic
              const aptDate = new Date(apt.appointment_date);
              const startHour = Math.min(...apt.time_slots);
              const endHour = Math.max(...apt.time_slots) + 1;
              
              const startTime = new Date(aptDate.setHours(startHour, 0, 0, 0));
              const endTime = new Date(aptDate.setHours(endHour, 0, 0, 0));
              
              // Exactly 30 minutes before
              const activationTime = new Date(startTime.getTime() - 30 * 60000); 

              // Check if meeting is currently happening or about to start
              const isLinkActive = currentTime >= activationTime && currentTime < endTime;
              const isPast = currentTime >= endTime;

              return (
                <div key={apt.id} className={`flex flex-col justify-between gap-6 rounded-3xl border p-8 transition-all sm:flex-row sm:items-start ${isPast ? 'border-[#3A3A38]/10 bg-white/30 opacity-70' : 'border-[#4F6F52]/20 bg-white shadow-sm hover:shadow-md'}`}>
                  
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${isPast ? 'bg-[#3A3A38]/10 text-[#3A3A38]/60' : 'bg-[#4F6F52]/10 text-[#4F6F52]'}`}>
                        {isPast ? 'Completed' : 'Upcoming'}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-widest text-[#88B7B5]">{apt.modality}</span>
                    </div>
                    
                    <h3 className="font-serif text-2xl font-medium text-[#2C4C5B]">Session with {apt.counselor_name}</h3>
                    
                    <div className="mt-4 flex flex-col gap-2 text-sm text-[#3A3A38]/80 sm:flex-row sm:gap-6">
                      <p className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-[#88B7B5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {new Date(apt.appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-[#88B7B5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {formatTimeRange(apt.time_slots)}
                      </p>
                    </div>

                    {/* Post-Session Homework Block */}
                    {(apt.homework || apt.homework_files?.length > 0) && (
                      <div className="mt-6 rounded-2xl bg-[#88B7B5]/10 p-5 border border-[#88B7B5]/20 max-w-xl">
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#2C4C5B] flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                          Post-Session Tasks
                        </p>
                        {apt.homework && (
                          <p className="text-sm text-[#3A3A38]/80 whitespace-pre-wrap leading-relaxed">{apt.homework}</p>
                        )}

                        {apt.homework_files?.length > 0 && (
                          <div className="mt-3 flex flex-col gap-1">
                            {apt.homework_files.map((f: any) => (
                              <a
                                key={f.path}
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-[#2C4C5B] underline underline-offset-2"
                              >
                                📎 Download {f.name}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Homework Submission (patient uploads their completed work) */}
                        {apt.homework && (
                          <div className="mt-4 pt-4 border-t border-[#88B7B5]/30">
                            {apt.homework_submission_files?.length > 0 ? (
                              <div>
                                <p className="text-[10px] uppercase tracking-widest text-[#4F6F52] font-semibold mb-1">Your submission:</p>
                                <div className="flex flex-col gap-1">
                                  {apt.homework_submission_files.map((f: any) => (
                                    <a
                                      key={f.path}
                                      href={f.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-semibold text-[#4F6F52] underline underline-offset-2"
                                    >
                                      📎 {f.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            ) : submittingAptId === apt.id ? (
                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase tracking-widest text-[#3A3A38]/60">
                                  Upload up to 2 files (max 5MB each)
                                </label>
                                <input
                                  type="file"
                                  multiple
                                  onChange={handleSubmissionFileSelect}
                                  className="w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#4F6F52]/10 file:px-3 file:py-2 file:text-[#4F6F52] file:text-xs file:font-semibold"
                                />
                                {pendingSubmissionFiles.length > 0 && (
                                  <p className="text-[10px] text-[#3A3A38]/60">{pendingSubmissionFiles.map((f) => f.name).join(", ")}</p>
                                )}
                                {submissionFileError && <p className="text-[10px] text-[#A65D47] font-semibold">{submissionFileError}</p>}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => uploadHomeworkSubmission(apt.id)}
                                    disabled={isUploadingSubmission}
                                    className="flex-1 bg-[#4F6F52] text-white py-2 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#3A533D]"
                                  >
                                    {isUploadingSubmission ? "Uploading..." : "Upload"}
                                  </button>
                                  <button
                                    onClick={() => { setSubmittingAptId(null); setPendingSubmissionFiles([]); setSubmissionFileError(""); }}
                                    className="flex-1 bg-white border border-[#3A3A38]/20 text-[#3A3A38] py-2 rounded-lg text-xs font-semibold uppercase tracking-wider"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setSubmittingAptId(apt.id)}
                                className="text-xs font-semibold uppercase tracking-widest text-[#4F6F52] hover:underline"
                              >
                                + Submit Your Homework
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Post-Session Feedback */}
                    {isPast && (
                      <div className="mt-6 max-w-xl">
                        {continuePromptAptId === apt.id ? (
                          <div className="rounded-2xl bg-[#F6D86B]/15 p-5 border border-[#F6D86B]/30">
                            <p className="text-sm font-medium text-[#2C4C5B] mb-3">
                              Thanks for your feedback! Would you like to continue with {apt.counselor_name}?
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => recordContinuePreference(apt, true)}
                                className="flex-1 bg-[#4F6F52] text-white py-2 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#3A533D]"
                              >
                                Yes, book again
                              </button>
                              <button
                                onClick={() => recordContinuePreference(apt, false)}
                                className="flex-1 bg-white border border-[#3A3A38]/20 text-[#3A3A38] py-2 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-gray-50"
                              >
                                No, show me others
                              </button>
                            </div>
                          </div>
                        ) : feedbackByAptId[apt.id] ? (
                          <div className="rounded-2xl bg-white p-5 border border-[#3A3A38]/10 text-sm text-[#3A3A38]/70">
                            <p className="font-semibold text-[#2C4C5B] mb-1">Feedback submitted — thank you!</p>
                            <p>{"★".repeat(feedbackByAptId[apt.id].rating)}{"☆".repeat(5 - feedbackByAptId[apt.id].rating)}</p>
                          </div>
                        ) : activeFeedbackAptId === apt.id ? (
                          <div className="rounded-2xl bg-white p-5 border border-[#3A3A38]/10">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#2C4C5B] mb-3">Rate Your Session</p>
                            <div className="flex gap-1 mb-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setFeedbackRating(star)}
                                  className={`text-2xl leading-none ${star <= feedbackRating ? "text-[#F6D86B]" : "text-[#3A3A38]/20"}`}
                                  aria-label={`${star} star`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <textarea
                              rows={3}
                              placeholder="How did the session go?"
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              className="w-full text-sm p-3 rounded-xl border border-[#3A3A38]/20 focus:outline-none focus:ring-1 focus:ring-[#4F6F52]"
                            />
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => submitFeedback(apt)}
                                disabled={isSubmittingFeedback}
                                className="flex-1 bg-[#4F6F52] text-white py-2 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#3A533D]"
                              >
                                {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
                              </button>
                              <button
                                onClick={() => { setActiveFeedbackAptId(null); setFeedbackRating(0); setFeedbackText(""); }}
                                className="flex-1 bg-white border border-[#3A3A38]/20 text-[#3A3A38] py-2 rounded-lg text-xs font-semibold uppercase tracking-wider"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveFeedbackAptId(apt.id)}
                            className="text-xs font-semibold uppercase tracking-widest text-[#2C4C5B] hover:underline"
                          >
                            + Leave Feedback
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  {!isPast && (
                    <div className="flex flex-col items-start gap-3 border-t border-[#3A3A38]/10 pt-6 sm:items-end sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                      {apt.modality === 'online' ? (
                        <>
                          <button 
                            disabled={!isLinkActive || !apt.meeting_link}
                            onClick={() => window.open(apt.meeting_link, "_blank")}
                            className={`w-full whitespace-nowrap rounded-full px-8 py-3 text-sm font-semibold tracking-wide transition-all sm:w-auto 
                              ${isLinkActive && apt.meeting_link ? 'bg-[#2C4C5B] text-[#FBF8F2] hover:-translate-y-1 hover:shadow-lg' : 'cursor-not-allowed bg-[#2C4C5B]/10 text-[#2C4C5B]/40'}`}
                          >
                            {isLinkActive && apt.meeting_link ? "Join Video Session" : "Link Activates 30m Prior"}
                          </button>
                          {!isLinkActive && <p className="text-[10px] uppercase tracking-widest text-[#3A3A38]/50">Check back closer to start time</p>}
                        </>
                      ) : (
                        <div className="rounded-xl bg-[#FBF8F2] p-4 text-left sm:text-right text-sm border border-[#3A3A38]/10">
                          <p className="font-semibold text-[#2C4C5B]">In-Person Session</p>
                          <p className="mt-1 text-xs text-[#3A3A38]/70">Please arrive at the clinic 15 minutes prior.</p>
                        </div>
                      )}
                      
                      {/* NEW: Triggers the Custom Modal Instead of window.confirm */}
                      <button 
                        onClick={() => setAppointmentToCancel(apt.id)}
                        className="mt-1 text-xs font-semibold text-red-500/80 underline-offset-4 hover:text-red-600 hover:underline transition-all"
                      >
                        Cancel & Refund
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* NEW: Custom Cancellation Modal */}
      {appointmentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A38]/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#FBF8F2] p-8 shadow-2xl">
            <h3 className="mb-2 font-serif text-2xl font-medium text-[#2C4C5B]">Cancel Session?</h3>
            <p className="mb-6 text-sm leading-relaxed text-[#3A3A38]/70">
              Are you sure you want to cancel this session? Your refund will be processed automatically to your original payment method.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setAppointmentToCancel(null)}
                disabled={isCancelling}
                className="flex-1 rounded-full border border-[#3A3A38]/20 bg-white py-3 text-sm font-semibold tracking-wide text-[#3A3A38] transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Session
              </button>
              <button
                onClick={confirmCancellation}
                disabled={isCancelling}
                className="flex-1 rounded-full bg-[#A65D47] py-3 text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}