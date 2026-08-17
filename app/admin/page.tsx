"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";

export default function AdminDashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Tab: applications vs appointments review
  const [activeTab, setActiveTab] = useState<"applications" | "appointments">("applications");

  // Appointments review state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [appointmentFilter, setAppointmentFilter] = useState<
    "all" | "completed" | "upcoming" | "cancelled" | "pending"
  >("all");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      router.push("/");
      return;
    }

    try {
      const res = await fetch("/admin/applications", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (res.status === 401 || res.status === 403) {
        alert("Unauthorized Access. Your email is not registered as an Admin.");
        router.push("/"); 
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch applications");

      const data = await res.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Slot index -> Date, matching the 15-min slot convention used everywhere
  // else (0 = 00:00, 40 = 10:00, 41 = 10:15 ... 95 = 23:45).
  const slotToDate = (baseDate: Date, slot: number) => {
    const d = new Date(baseDate);
    d.setHours(0, 0, 0, 0);
    d.setMinutes(slot * 15);
    return d;
  };
  const formatSlotTime = (slot: number) => {
    const totalMinutes = slot * 15;
    const h24 = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const ampm = h24 >= 12 ? "PM" : "AM";
    const h = h24 % 12 || 12;
    return `${h < 10 ? "0" : ""}${h}:${m < 10 ? "0" : ""}${m} ${ampm}`;
  };
  const formatTimeRange = (slots: number[]) => {
    if (!slots || slots.length === 0) return "TBD";
    const startSlot = Math.min(...slots);
    const endSlot = Math.max(...slots) + 1;
    return `${formatSlotTime(startSlot)} - ${formatSlotTime(endSlot)}`;
  };

  // An appointment is "completed" once it's paid and its slot has fully
  // passed; "upcoming" if paid and still ahead; independent of those,
  // "cancelled" and "pending" are shown as their own statuses.
  const computeAppointmentStatus = (apt: any): "completed" | "upcoming" | "cancelled" | "pending" => {
    if (apt.status === "cancelled") return "cancelled";
    if (apt.status === "pending") return "pending";
    if (apt.status === "paid") {
      const endSlot = Math.max(...(apt.time_slots || [0])) + 1;
      const end = slotToDate(new Date(apt.appointment_date), endSlot);
      return currentTime >= end ? "completed" : "upcoming";
    }
    return "pending";
  };

  const fetchAppointments = useCallback(async () => {
    setIsLoadingAppointments(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.push("/");
      return;
    }
    try {
      const res = await fetch("/admin/appointments", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 401 || res.status === 403) {
        alert("Unauthorized Access. Your email is not registered as an Admin.");
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch appointments");
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [router]);

  useEffect(() => {
    if (activeTab === "appointments") fetchAppointments();
  }, [activeTab, fetchAppointments]);

  const appointmentCounts = {
    all: appointments.length,
    completed: appointments.filter((a) => computeAppointmentStatus(a) === "completed").length,
    upcoming: appointments.filter((a) => computeAppointmentStatus(a) === "upcoming").length,
    cancelled: appointments.filter((a) => computeAppointmentStatus(a) === "cancelled").length,
    pending: appointments.filter((a) => computeAppointmentStatus(a) === "pending").length,
  };

  const filteredAppointments =
    appointmentFilter === "all"
      ? appointments
      : appointments.filter((a) => computeAppointmentStatus(a) === appointmentFilter);

  const handleAccept = async (appId: string) => {
    setIsProcessing(appId);
    
    // 1. Get the current user's secure session token instead of exposing a public secret
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      alert("Session expired. Please log in again.");
      return;
    }

    try {
      const res = await fetch("/api/applications/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` // SECURE: Uses JWT instead of hardcoded secret
        },
        body: JSON.stringify({ appId }),
      });

      if (!res.ok) throw new Error("Failed to process acceptance");

      alert("Applicant Accepted! The 24-hour timer has started and the email has been sent.");
      fetchApplications(); 
    } catch (error) {
      console.error(error);
      alert("Error accepting application. Please try again.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRevoke = async (appId: string) => {
    if (!confirm("Are you sure you want to revoke this seat? It will be given to the next person.")) return;
    setIsProcessing(appId);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      alert("Session expired. Please log in again.");
      setIsProcessing(null);
      return;
    }

    try {
      // SECURE: Server-side database write instead of client-side RLS bypass
      const res = await fetch("/api/applications/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ appId }),
      });

      if (!res.ok) throw new Error("Failed to revoke application");

      fetchApplications();
    } catch (error) {
      console.error(error);
      alert("Error revoking application. Please try again.");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-32">
        <div className="mb-8 border-b border-[#3A3A38]/10 pb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.35em] text-[#A65D47]">Admin Portal</p>
          <h1 className="font-serif text-4xl font-medium text-[#2C4C5B]">
            {activeTab === "applications" ? "Waitlist & Applications Engine" : "Appointments & Session Review"}
          </h1>
        </div>

        <div className="mb-10 flex gap-2 border-b border-[#3A3A38]/10">
          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`px-5 py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
              activeTab === "applications"
                ? "border-b-2 border-[#2C4C5B] text-[#2C4C5B]"
                : "text-[#3A3A38]/50 hover:text-[#3A3A38]"
            }`}
          >
            Applications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("appointments")}
            className={`px-5 py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
              activeTab === "appointments"
                ? "border-b-2 border-[#2C4C5B] text-[#2C4C5B]"
                : "text-[#3A3A38]/50 hover:text-[#3A3A38]"
            }`}
          >
            Appointments
          </button>
        </div>

        {activeTab === "applications" ? (
        isLoading ? (
          <p className="animate-pulse tracking-widest text-[#88B7B5]">Verifying Secure Access...</p>
        ) : applications.length === 0 ? (
          <div className="rounded-3xl border border-[#3A3A38]/10 bg-white/50 py-20 text-center">
            <h3 className="font-serif text-2xl text-[#3A3A38]">No Applications Yet</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => {
              let hoursLeft = 0;
              let isExpired = false;

              if (app.status === "accepted" && app.accepted_at) {
                const diffMs = currentTime.getTime() - new Date(app.accepted_at).getTime();
                hoursLeft = Math.max(0, 24 - (diffMs / (1000 * 60 * 60)));
                isExpired = hoursLeft === 0;
              }

              return (
                <div key={app.id} className="flex flex-col rounded-3xl border border-[#3A3A38]/10 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#88B7B5]">{app.program_type}</p>
                      <h3 className="font-serif text-lg font-medium text-[#2C4C5B] leading-tight">{app.program_title}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest
                      ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${app.status === 'accepted' && !isExpired ? 'bg-blue-100 text-blue-700' : ''}
                      ${app.status === 'accepted' && isExpired ? 'bg-red-100 text-red-700 animate-pulse' : ''}
                      ${app.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                      ${app.status === 'expired' ? 'bg-gray-200 text-gray-500 line-through' : ''}
                    `}>
                      {app.status === 'accepted' && isExpired ? 'EXPIRED' : app.status}
                    </span>
                  </div>

                  <div className="mb-6 flex-1 rounded-2xl bg-[#FBF8F2] p-4 text-sm">
                    <p><strong className="text-[#3A3A38]">Name:</strong> {app.applicant_name}</p>
                    <p><strong className="text-[#3A3A38]">Email:</strong> {app.applicant_email}</p>
                    <p><strong className="text-[#3A3A38]">Phone:</strong> {app.applicant_phone}</p>
                    <div className="mt-3 border-t border-[#3A3A38]/10 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3A3A38]/60">Statement of Purpose</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#3A3A38]/80 line-clamp-4 hover:line-clamp-none">{app.statement_of_purpose}</p>
                    </div>
                  </div>

                  <div className="border-t border-[#3A3A38]/10 pt-4">
                    {app.status === 'pending' && (
                      <button onClick={() => handleAccept(app.id)} disabled={isProcessing === app.id} className="w-full rounded-full bg-[#2C4C5B] py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#1E3A5F] disabled:opacity-50">
                        {isProcessing === app.id ? "Processing..." : "Accept & Start 24hr Timer"}
                      </button>
                    )}

                    {app.status === 'accepted' && !isExpired && (
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-widest text-[#3A3A38]/60">Awaiting Payment</p>
                        <p className="font-serif text-xl text-[#2C4C5B]">{Math.ceil(hoursLeft)} Hours Left</p>
                      </div>
                    )}

                    {app.status === 'accepted' && isExpired && (
                      <button onClick={() => handleRevoke(app.id)} disabled={isProcessing === app.id} className="w-full rounded-full bg-[#A65D47] py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-red-800 disabled:opacity-50">
                        {isProcessing === app.id ? "Processing..." : "Revoke Seat"}
                      </button>
                    )}

                    {app.status === 'paid' && (
                      <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#4F6F52]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Seat Secured
                      </div>
                    )}

                    {app.status === 'expired' && <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/40">Skipped</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )
        ) : (
          <div>
            {/* Filter tabs */}
            <div className="mb-8 flex flex-wrap gap-2">
              {(["all", "completed", "upcoming", "cancelled", "pending"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAppointmentFilter(f)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest border transition ${
                    appointmentFilter === f
                      ? "bg-[#2C4C5B] text-white border-[#2C4C5B]"
                      : "bg-white text-[#3A3A38]/70 border-[#3A3A38]/10 hover:border-[#2C4C5B]/40"
                  }`}
                >
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({appointmentCounts[f]})
                </button>
              ))}
            </div>

            {isLoadingAppointments ? (
              <p className="animate-pulse tracking-widest text-[#88B7B5]">Loading appointments...</p>
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-3xl border border-[#3A3A38]/10 bg-white/50 py-20 text-center">
                <h3 className="font-serif text-2xl text-[#3A3A38]">No appointments in this view</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAppointments.map((apt) => {
                  const computed = computeAppointmentStatus(apt);
                  return (
                    <div key={apt.id} className="flex flex-col rounded-3xl border border-[#3A3A38]/10 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#88B7B5]">
                            {new Date(apt.appointment_date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <h3 className="font-serif text-lg font-medium text-[#2C4C5B] leading-tight">
                            {formatTimeRange(apt.time_slots)}
                          </h3>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest
                            ${computed === "completed" ? "bg-green-100 text-green-700" : ""}
                            ${computed === "upcoming" ? "bg-blue-100 text-blue-700" : ""}
                            ${computed === "cancelled" ? "bg-gray-200 text-gray-500 line-through" : ""}
                            ${computed === "pending" ? "bg-yellow-100 text-yellow-700" : ""}
                          `}
                        >
                          {computed}
                        </span>
                      </div>

                      <div className="mb-4 flex-1 rounded-2xl bg-[#FBF8F2] p-4 text-sm">
                        <p><strong className="text-[#3A3A38]">Patient:</strong> {apt.patient_name}</p>
                        <p className="text-xs text-[#3A3A38]/60">{apt.patient_email}</p>
                        <p className="mt-2"><strong className="text-[#3A3A38]">Psychologist:</strong> {apt.counselor_name}</p>
                        <p className="text-xs text-[#3A3A38]/60">{apt.counselor_email}</p>
                        <p className="mt-2 text-xs uppercase tracking-widest text-[#3A3A38]/50">
                          {apt.modality} {apt.total_price ? `· ₹${apt.total_price}` : ""}
                        </p>
                      </div>

                      {computed === "completed" && (
                        <div className="border-t border-[#3A3A38]/10 pt-4">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                            Patient Feedback
                          </p>
                          {apt.feedback ? (
                            <div className="rounded-xl bg-[#4F6F52]/5 p-3">
                              <div className="mb-1 flex items-center gap-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <span key={i} className={i < apt.feedback.rating ? "text-[#4F6F52]" : "text-[#3A3A38]/20"}>
                                    ★
                                  </span>
                                ))}
                                <span className="ml-2 text-xs text-[#3A3A38]/60">
                                  {apt.feedback.wants_to_continue ? "Wants to continue" : "Not continuing"}
                                </span>
                              </div>
                              {apt.feedback.feedback_text && (
                                <p className="text-xs italic leading-relaxed text-[#3A3A38]/80">
                                  &quot;{apt.feedback.feedback_text}&quot;
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-[#3A3A38]/50 italic">No feedback submitted yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}