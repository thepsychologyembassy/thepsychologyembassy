"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { client } from "../../lib/sanity";
import Navbar from "../../components/Navbar";

export default function CounselorPortal() {
  const router = useRouter();
  const [counselor, setCounselor] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Homework State
  const [editingHomeworkId, setEditingHomeworkId] = useState<string | null>(null);
  const [homeworkText, setHomeworkText] = useState("");
  const [homeworkFiles, setHomeworkFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [fileErrorMsg, setFileErrorMsg] = useState("");

  // Calendar blocking state: Set of "date|hour" keys currently blocked.
  const [blockedSlotKeys, setBlockedSlotKeys] = useState<Set<string>>(new Set());
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const authHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}` };
  };

  useEffect(() => {
    const fetchCounselorData = async () => {
      // 1. Check Auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        router.push("/login");
        return;
      }

      const userEmail = session.user.email.toLowerCase().trim(); // Forces strict formatting

      // 2. Verify Counselor in Sanity (Bypasses Cache for real-time checks)
      const sanityCounselor = await client.fetch(
        `*[_type == "counselor" && email == $email][0]`,
        { email: userEmail },
        { cache: "no-store" } // Forces Next.js to ignore cached data
      );

      if (!sanityCounselor) {
        alert(`Access Denied: ${userEmail} is not registered as a Psychologist.`);
        router.push("/dashboard");
        return;
      }
      setCounselor(sanityCounselor);

      // 3. Fetch their Patients' Appointments
      const { data: apts, error } = await supabase
        .from("appointments")
        .select("*")
        .ilike("counselor_email", userEmail) // Changed to .ilike just in case!
        .eq("status", "paid")
        .order("appointment_date", { ascending: true });
      console.log("DEBUG - Fetched Appointments:", apts);
      console.log("DEBUG - Supabase Error:", error);
      if (!error && apts) setAppointments(apts);

      // 4. Fetch this counselor's currently blocked slots
      try {
        const headers = await authHeader();
        const res = await fetch("/api/counselor/blocked-slots", { headers });
        if (res.ok) {
          const { blockedSlots } = await res.json();
          setBlockedSlotKeys(new Set((blockedSlots || []).map((b: any) => `${b.slot_date}|${b.hour}`)));
        }
      } catch (err) {
        console.error("Failed to load blocked slots:", err);
      }

      setIsLoading(false);
    };

    fetchCounselorData();
  }, [router]);

  // Helper: Format hours into readable time
  const formatTime = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h < 10 ? '0' : ''}${h}:00 ${ampm}`;
  };

  // Helper: Calculate Next 6 Days Availability
  const getNext6Days = () => {
    if (!counselor) return [];
    const days = [];
    const shiftStart = counselor.shiftStart || 12; // Default 12 PM
    const shiftEnd = counselor.shiftEnd || 20;     // Default 8 PM
    
    for (let i = 1; i <= 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      
      // Find all booked hours for this specific day
      const bookedHours = appointments
        .filter(apt => apt.appointment_date === dateStr)
        .flatMap(apt => apt.time_slots);

      const isBlocked = counselor.blockedDates?.includes(dateStr);

      days.push({
        date: dateStr,
        displayDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        bookedHours,
        isBlocked,
        shiftStart,
        shiftEnd
      });
    }
    return days;
  };

  const toggleSlotBlock = async (dateStr: string, hour: number, isCurrentlyBlocked: boolean) => {
    const key = `${dateStr}|${hour}`;
    setTogglingKey(key);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/counselor/blocked-slots", {
        method: isCurrentlyBlocked ? "DELETE" : "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, hour }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Failed to update slot.");
        return;
      }
      setBlockedSlotKeys((prev) => {
        const next = new Set(prev);
        if (isCurrentlyBlocked) next.delete(key);
        else next.add(key);
        return next;
      });
    } catch (err) {
      alert("A network error occurred. Please try again.");
    } finally {
      setTogglingKey(null);
    }
  };

  const handleHomeworkFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || []);
    setFileErrorMsg("");
    if (chosen.length > 2) {
      setFileErrorMsg("You can attach at most 2 files.");
      return;
    }
    const tooBig = chosen.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      setFileErrorMsg(`"${tooBig.name}" is over 5MB. Please choose a smaller file.`);
      return;
    }
    setHomeworkFiles(chosen);
  };

  const saveHomework = async (aptId: string) => {
    setIsSaving(true);
    setFileErrorMsg("");
    try {
      const headers = await authHeader();
      const formData = new FormData();
      formData.append("appointmentId", aptId);
      formData.append("homework", homeworkText);
      homeworkFiles.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/homework/assign", {
        method: "POST",
        headers,
        body: formData,
      });
      const result = await res.json();

      if (res.ok) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === aptId ? { ...apt, homework: homeworkText, homework_files: result.homework_files } : apt
          )
        );
        setEditingHomeworkId(null);
        setHomeworkText("");
        setHomeworkFiles([]);
      } else {
        alert(result.error || "Failed to save homework. Please try again.");
      }
    } catch (err) {
      alert("A network error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <div className="mb-12 border-b border-[#3A3A38]/10 pb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.35em] text-[#4F6F52]">Psychologist Portal</p>
          <h1 className="font-serif text-4xl font-medium text-[#2C4C5B]">Welcome, {counselor?.name || "Professional"}</h1>
        </div>

        {isLoading ? (
          <p className="animate-pulse tracking-widest text-[#88B7B5]">Loading securely...</p>
        ) : (
          <div className="flex flex-col gap-16">
            
            {/* 1. SCHEDULE OVERVIEW (NEXT 6 DAYS) */}
            <div>
              <h2 className="font-serif text-2xl text-[#2C4C5B] mb-6">Your Availability (Next 6 Days)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getNext6Days().map((day, idx) => {
                  const totalSlots = day.shiftEnd - day.shiftStart;
                  const availableSlots = totalSlots - day.bookedHours.length;

                  return (
                    <div key={idx} className="bg-white rounded-3xl p-6 border border-[#3A3A38]/10 shadow-sm">
                      <p className="font-bold text-[#2C4C5B] mb-1">{day.displayDate}</p>
                      
                      {day.isBlocked ? (
                        <p className="text-sm font-semibold text-[#A65D47] mt-4 uppercase tracking-widest">Marked as Unavailable</p>
                      ) : (
                        <>
                          <p className="text-xs uppercase tracking-widest text-[#3A3A38]/60 mb-4 border-b border-[#3A3A38]/10 pb-2">
                            {availableSlots} slots open · tap a slot to block/unblock it
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: totalSlots }, (_, i) => day.shiftStart + i).map(hour => {
                              const isBooked = day.bookedHours.includes(hour);
                              const slotKey = `${day.date}|${hour}`;
                              const isBlocked = blockedSlotKeys.has(slotKey);
                              const isToggling = togglingKey === slotKey;
                              return (
                                <button
                                  key={hour}
                                  type="button"
                                  disabled={isBooked || isToggling}
                                  onClick={() => toggleSlotBlock(day.date, hour, isBlocked)}
                                  title={isBooked ? "Already booked" : isBlocked ? "Click to unblock" : "Click to block"}
                                  className={`text-center py-2 rounded-lg text-[10px] font-semibold border transition ${
                                    isBooked
                                      ? 'bg-[#A65D47]/10 text-[#A65D47] border-[#A65D47]/20 line-through cursor-not-allowed'
                                      : isBlocked
                                      ? 'bg-[#3A3A38]/10 text-[#3A3A38]/50 border-[#3A3A38]/20 line-through cursor-pointer hover:bg-[#3A3A38]/15'
                                      : 'bg-[#4F6F52]/10 text-[#4F6F52] border-[#4F6F52]/20 cursor-pointer hover:bg-[#4F6F52]/20'
                                  } ${isToggling ? 'opacity-50' : ''}`}
                                >
                                  {formatTime(hour)}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. PATIENT APPOINTMENTS & HOMEWORK ENGINE */}
            <div>
              <h2 className="font-serif text-2xl text-[#2C4C5B] mb-6">Patient Roster & Homework</h2>
              {appointments.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-[#3A3A38]/10">
                  <p className="text-[#3A3A38]/60">No patient sessions booked right now.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {appointments.map(apt => (
                    <div key={apt.id} className="flex flex-col lg:flex-row gap-6 bg-white rounded-3xl p-8 border border-[#3A3A38]/10 shadow-sm">
                      
                      {/* Patient Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-[#2C4C5B]/10 text-[#2C4C5B] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                            {apt.modality}
                          </span>
                          <span className="text-xs font-semibold text-[#88B7B5]">{apt.status}</span>
                        </div>
                        <h3 className="font-serif text-xl font-medium text-[#2C4C5B] mb-1">{apt.patient_name}</h3>
                        <p className="text-sm text-[#3A3A38]/70 mb-4">{apt.patient_email}</p>
                        
                        <div className="bg-[#FBF8F2] p-4 rounded-xl text-sm border border-[#3A3A38]/5">
                          <p><strong>Date:</strong> {apt.appointment_date}</p>
                          <p className="mt-1"><strong>Time:</strong> {formatTime(Math.min(...apt.time_slots))} - {formatTime(Math.max(...apt.time_slots) + 1)}</p>
                          {apt.patient_notes && (
                            <div className="mt-3 pt-3 border-t border-[#3A3A38]/10">
                              <p className="text-[10px] uppercase tracking-widest text-[#3A3A38]/60 mb-1">Patient Notes:</p>
                              <p className="italic text-[#3A3A38]/80">{apt.patient_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Column: Meeting Link & Homework */}
                      <div className="flex-1 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-[#3A3A38]/10 pt-6 lg:pt-0 lg:pl-6">
                        
                        {/* Meeting Link Button */}
                        {apt.modality === 'online' && apt.meeting_link && (
                          <button 
                            onClick={() => window.open(apt.meeting_link, "_blank")}
                            className="w-full bg-[#2C4C5B] text-white py-3 rounded-full text-xs font-semibold uppercase tracking-widest transition hover:bg-[#1E3A5F]"
                          >
                            Launch Video Session
                          </button>
                        )}

                        {/* Homework Editor */}
                        <div className="bg-[#88B7B5]/10 rounded-2xl p-5 border border-[#88B7B5]/20 flex-1">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#2C4C5B]">Post-Session Homework</p>
                            {editingHomeworkId !== apt.id && (
                              <button 
                                onClick={() => {
                                  setEditingHomeworkId(apt.id);
                                  setHomeworkText(apt.homework || "");
                                  setHomeworkFiles([]);
                                  setFileErrorMsg("");
                                }}
                                className="text-[10px] uppercase tracking-widest text-[#4F6F52] hover:underline"
                              >
                                {apt.homework ? "Edit" : "+ Assign"}
                              </button>
                            )}
                          </div>

                          {editingHomeworkId === apt.id ? (
                            <div className="flex flex-col gap-3">
                              <textarea 
                                rows={3}
                                className="w-full text-sm p-3 rounded-xl border border-[#3A3A38]/20 focus:outline-none focus:ring-1 focus:ring-[#4F6F52]"
                                placeholder="Assign reading, journaling, or specific exercises..."
                                value={homeworkText}
                                onChange={(e) => setHomeworkText(e.target.value)}
                              />
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-[#3A3A38]/60 mb-1 block">
                                  Attach up to 2 files (max 5MB each)
                                </label>
                                <input
                                  type="file"
                                  multiple
                                  onChange={handleHomeworkFileSelect}
                                  className="w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-[#4F6F52]/10 file:px-3 file:py-2 file:text-[#4F6F52] file:text-xs file:font-semibold"
                                />
                                {homeworkFiles.length > 0 && (
                                  <p className="mt-1 text-[10px] text-[#3A3A38]/60">
                                    {homeworkFiles.map((f) => f.name).join(", ")}
                                  </p>
                                )}
                                {fileErrorMsg && (
                                  <p className="mt-1 text-[10px] text-[#A65D47] font-semibold">{fileErrorMsg}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => saveHomework(apt.id)}
                                  disabled={isSaving}
                                  className="flex-1 bg-[#4F6F52] text-white py-2 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#3A533D]"
                                >
                                  {isSaving ? "Saving..." : "Save"}
                                </button>
                                <button 
                                  onClick={() => { setEditingHomeworkId(null); setHomeworkFiles([]); setFileErrorMsg(""); }}
                                  className="flex-1 bg-white border border-[#3A3A38]/20 text-[#3A3A38] py-2 rounded-lg text-xs font-semibold uppercase tracking-wider"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <p className="text-sm text-[#3A3A38]/80 whitespace-pre-wrap">
                                {apt.homework || <span className="italic opacity-50">No homework assigned yet.</span>}
                              </p>
                              {apt.homework_files?.length > 0 && (
                                <div className="flex flex-col gap-1">
                                  {apt.homework_files.map((f: any) => (
                                    <a
                                      key={f.path}
                                      href={f.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-semibold text-[#2C4C5B] underline underline-offset-2"
                                    >
                                      📎 {f.name}
                                    </a>
                                  ))}
                                </div>
                              )}
                              {apt.homework_submission_files?.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-[#88B7B5]/30">
                                  <p className="text-[10px] uppercase tracking-widest text-[#3A3A38]/60 mb-1">Patient Submission:</p>
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
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </section>
    </main>
  );
}