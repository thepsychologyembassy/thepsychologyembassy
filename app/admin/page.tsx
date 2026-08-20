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

  // Tab: applications vs appointments review vs intake forms
  const [activeTab, setActiveTab] = useState<"applications" | "appointments" | "intake">("applications");

  // Applications are grouped into "opportunity folders" (one per program).
  // null = showing the folder grid; a program_id = drilled into that folder.
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  // Appointments review state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [appointmentFilter, setAppointmentFilter] = useState<
    "all" | "completed" | "upcoming" | "cancelled" | "pending"
  >("all");
  const [isDeletingPast, setIsDeletingPast] = useState(false);

  // Intake forms state
  const [intakeForms, setIntakeForms] = useState<any[]>([]);
  const [isLoadingIntake, setIsLoadingIntake] = useState(true);
  const [selectedIntakeId, setSelectedIntakeId] = useState<string | null>(null);

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
      // Latest first, by appointment date.
      const sorted = (data.appointments || []).slice().sort(
        (a: any, b: any) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
      );
      setAppointments(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [router]);

  useEffect(() => {
    if (activeTab === "appointments") fetchAppointments();
  }, [activeTab, fetchAppointments]);

  const fetchIntakeForms = useCallback(async () => {
    setIsLoadingIntake(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.push("/");
      return;
    }
    try {
      const res = await fetch("/admin/intake", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 401 || res.status === 403) {
        alert("Unauthorized Access. Your email is not registered as an Admin.");
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch intake forms");
      const data = await res.json();
      // Already latest-first from the server (ordered by created_at desc).
      setIntakeForms(data.intakeForms || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingIntake(false);
    }
  }, [router]);

  useEffect(() => {
    if (activeTab === "intake") fetchIntakeForms();
  }, [activeTab, fetchIntakeForms]);

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

  const handleReject = async (appId: string) => {
    if (!confirm("Are you sure you want to reject this application? The applicant will be notified by email.")) return;
    setIsProcessing(appId);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert("Session expired. Please log in again.");
      setIsProcessing(null);
      return;
    }

    try {
      const res = await fetch("/api/applications/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ appId }),
      });

      if (!res.ok) throw new Error("Failed to reject application");

      fetchApplications();
    } catch (error) {
      console.error(error);
      alert("Error rejecting application. Please try again.");
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

  const handleDeletePastAppointments = async () => {
    if (!confirm("This will permanently delete every appointment dated before today. This cannot be undone. Continue?")) return;
    setIsDeletingPast(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      alert("Session expired. Please log in again.");
      setIsDeletingPast(false);
      return;
    }

    try {
      const res = await fetch("/api/appointments/delete-past", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to delete past appointments");

      const data = await res.json();
      alert(`Deleted ${data.deletedCount} past appointment(s).`);
      fetchAppointments();
    } catch (error) {
      console.error(error);
      alert("Error deleting past appointments. Please try again.");
    } finally {
      setIsDeletingPast(false);
    }
  };

  // Group applications into one "folder" per opportunity (program), so the
  // admin can drill into a single internship/course instead of scanning a
  // flat list of every applicant across every program at once.
  const programGroups = applications.reduce((acc: Record<string, any>, app: any) => {
    const key = app.program_id || "unknown";
    if (!acc[key]) {
      acc[key] = {
        program_id: app.program_id,
        program_title: app.program_title,
        program_type: app.program_type,
        applications: [] as any[],
      };
    }
    acc[key].applications.push(app);
    return acc;
  }, {});
  const programGroupList = Object.values(programGroups).sort(
    (a: any, b: any) => b.applications.length - a.applications.length
  );
  const selectedGroup = selectedProgramId ? programGroups[selectedProgramId] : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const selectedIntake = selectedIntakeId
    ? intakeForms.find((f) => f.id === selectedIntakeId)
    : null;

  const genderLabel = (form: any) => {
    if (!form.gender) return "—";
    if (form.gender === "self_described") return form.gender_self_described || "Self-described";
    return form.gender
      .split("_")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-32">
        <div className="mb-8 border-b border-[#3A3A38]/10 pb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.35em] text-[#A65D47]">Admin Portal</p>
          <h1 className="font-serif text-4xl font-medium text-[#2C4C5B]">
            {activeTab === "applications" && "Waitlist & Applications Engine"}
            {activeTab === "appointments" && "Appointments & Session Review"}
            {activeTab === "intake" && "Intake Forms"}
          </h1>
        </div>

        <div className="mb-10 flex gap-2 border-b border-[#3A3A38]/10">
          <button
            type="button"
            onClick={() => { setActiveTab("applications"); }}
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
          <button
            type="button"
            onClick={() => setActiveTab("intake")}
            className={`px-5 py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
              activeTab === "intake"
                ? "border-b-2 border-[#2C4C5B] text-[#2C4C5B]"
                : "text-[#3A3A38]/50 hover:text-[#3A3A38]"
            }`}
          >
            Intake Forms
          </button>
        </div>

        {activeTab === "applications" ? (
          isLoading ? (
            <p className="animate-pulse tracking-widest text-[#88B7B5]">Verifying Secure Access...</p>
          ) : applications.length === 0 ? (
            <div className="rounded-3xl border border-[#3A3A38]/10 bg-white/50 py-20 text-center">
              <h3 className="font-serif text-2xl text-[#3A3A38]">No Applications Yet</h3>
            </div>
          ) : !selectedGroup ? (
            /* ── Opportunity folders: one card per program ── */
            <div>
              <p className="mb-6 text-sm text-[#3A3A38]/60">Select an opportunity to view its applicants.</p>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {programGroupList.map((group: any) => {
                  const pendingCount = group.applications.filter((a: any) => a.status === "pending").length;
                  const paidCount = group.applications.filter((a: any) => a.status === "paid").length;
                  return (
                    <button
                      key={group.program_id}
                      type="button"
                      onClick={() => setSelectedProgramId(group.program_id)}
                      className="flex flex-col items-start rounded-3xl border border-[#3A3A38]/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="mb-4 flex w-full items-start justify-between">
                        <svg className="h-8 w-8 text-[#A65D47]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                        </svg>
                        <span className="rounded-full bg-[#FBF8F2] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#3A3A38]/60">
                          {group.applications.length} {group.applications.length === 1 ? "Applicant" : "Applicants"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#88B7B5]">{group.program_type}</p>
                      <h3 className="mb-3 font-serif text-lg font-medium leading-tight text-[#2C4C5B]">{group.program_title}</h3>
                      <div className="mt-auto flex gap-2 pt-2 text-[10px] font-semibold uppercase tracking-widest">
                        {pendingCount > 0 && <span className="rounded-full bg-yellow-100 px-2 py-1 text-yellow-700">{pendingCount} Pending</span>}
                        {paidCount > 0 && <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">{paidCount} Secured</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Drilled into one opportunity's applicants ── */
            <div>
              <button
                type="button"
                onClick={() => setSelectedProgramId(null)}
                className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#2C4C5B] hover:text-[#A65D47]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                All Opportunities
              </button>
              <div className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#88B7B5]">{selectedGroup.program_type}</p>
                <h2 className="font-serif text-2xl font-medium text-[#2C4C5B]">{selectedGroup.program_title}</h2>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {selectedGroup.applications.map((app: any) => {
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
                          ${app.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
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
                          <div className="flex gap-2">
                            <button onClick={() => handleAccept(app.id)} disabled={isProcessing === app.id} className="flex-1 rounded-full bg-[#2C4C5B] py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#1E3A5F] disabled:opacity-50">
                              {isProcessing === app.id ? "..." : "Accept"}
                            </button>
                            <button onClick={() => handleReject(app.id)} disabled={isProcessing === app.id} className="flex-1 rounded-full border border-[#A65D47] py-3 text-xs font-semibold uppercase tracking-widest text-[#A65D47] transition-colors hover:bg-[#A65D47] hover:text-white disabled:opacity-50">
                              {isProcessing === app.id ? "..." : "Reject"}
                            </button>
                          </div>
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

                        {app.status === 'rejected' && <p className="text-center text-xs font-semibold uppercase tracking-widest text-red-500/70">Rejected</p>}
                        {app.status === 'expired' && <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/40">Skipped</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : activeTab === "appointments" ? (
          <div>
            {/* Filter tabs + destructive cleanup action */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
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
              <button
                type="button"
                onClick={handleDeletePastAppointments}
                disabled={isDeletingPast}
                className="inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                </svg>
                {isDeletingPast ? "Deleting..." : "Delete Past Appointments"}
              </button>
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
                        <p><strong className="text-[#3A3A38]">Client:</strong> {apt.patient_name}</p>
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
                            Client Feedback
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
        ) : (
          /* ── Intake Forms tab ── */
          <div>
            {isLoadingIntake ? (
              <p className="animate-pulse tracking-widest text-[#88B7B5]">Loading intake forms...</p>
            ) : intakeForms.length === 0 ? (
              <div className="rounded-3xl border border-[#3A3A38]/10 bg-white/50 py-20 text-center">
                <h3 className="font-serif text-2xl text-[#3A3A38]">No Intake Forms Yet</h3>
              </div>
            ) : !selectedIntake ? (
              /* List view: name, date, psychologist — latest first */
              <div className="flex flex-col gap-3">
                {intakeForms.map((form) => (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => setSelectedIntakeId(form.id)}
                    className="flex flex-col gap-2 rounded-2xl border border-[#3A3A38]/10 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg font-medium text-[#2C4C5B]">{form.full_name || "Unnamed"}</h3>
                      <p className="text-xs text-[#3A3A38]/60">{form.email}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#88B7B5]">
                        {formatDate(form.created_at)}
                      </p>
                      <p className="text-xs text-[#3A3A38]/70">
                        {form.selected_counselor_name
                          ? `Assigned: ${form.selected_counselor_name}`
                          : form.matched_counselor_names?.length
                          ? `Matched: ${form.matched_counselor_names.join(", ")}`
                          : "Not yet matched"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Detail view: the complete intake form */
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedIntakeId(null)}
                  className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#2C4C5B] hover:text-[#A65D47]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  All Intake Forms
                </button>

                <div className="rounded-3xl border border-[#3A3A38]/10 bg-white p-8 shadow-sm">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-[#3A3A38]/10 pb-6">
                    <div>
                      <h2 className="font-serif text-2xl font-medium text-[#2C4C5B]">{selectedIntake.full_name || "Unnamed"}</h2>
                      <p className="text-sm text-[#3A3A38]/60">Submitted {formatDate(selectedIntake.created_at)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#FBF8F2] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#3A3A38]/60">
                      {selectedIntake.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#FBF8F2] p-4 text-sm">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#3A3A38]/60">Contact</p>
                      <p><strong className="text-[#3A3A38]">Email:</strong> {selectedIntake.email}</p>
                      <p><strong className="text-[#3A3A38]">Phone:</strong> {selectedIntake.phone}{selectedIntake.phone_extension ? ` x${selectedIntake.phone_extension}` : ""}</p>
                      <p><strong className="text-[#3A3A38]">Age:</strong> {selectedIntake.age || "—"}</p>
                      <p><strong className="text-[#3A3A38]">Gender:</strong> {genderLabel(selectedIntake)}</p>
                    </div>

                    <div className="rounded-2xl bg-[#FBF8F2] p-4 text-sm">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#3A3A38]/60">Matching</p>
                      <p><strong className="text-[#3A3A38]">Been to therapy before:</strong> {selectedIntake.therapy_before === true ? "Yes" : selectedIntake.therapy_before === false ? "No" : "—"}</p>
                      <p><strong className="text-[#3A3A38]">Assigned Psychologist:</strong> {selectedIntake.selected_counselor_name || "Not yet selected"}</p>
                      {selectedIntake.matched_counselor_names?.length > 0 && (
                        <p><strong className="text-[#3A3A38]">Matched Options:</strong> {selectedIntake.matched_counselor_names.join(", ")}</p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-[#FBF8F2] p-4 text-sm sm:col-span-2">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#3A3A38]/60">Presenting Issues</p>
                      <p className="whitespace-pre-wrap leading-relaxed text-[#3A3A38]/80">{selectedIntake.presenting_issues || "—"}</p>
                    </div>

                    {selectedIntake.therapy_expectations && (
                      <div className="rounded-2xl bg-[#FBF8F2] p-4 text-sm sm:col-span-2">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#3A3A38]/60">Therapy Expectations</p>
                        <p className="whitespace-pre-wrap leading-relaxed text-[#3A3A38]/80">{selectedIntake.therapy_expectations}</p>
                      </div>
                    )}

                    {selectedIntake.additional_notes && (
                      <div className="rounded-2xl bg-[#FBF8F2] p-4 text-sm sm:col-span-2">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#3A3A38]/60">Additional Notes</p>
                        <p className="whitespace-pre-wrap leading-relaxed text-[#3A3A38]/80">{selectedIntake.additional_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}