"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    // Update the clock every minute so the 15-minute button activation is live
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Authenticate
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push("/login"); // Kick them out if not logged in
        return;
      }
      
      setUser(session.user);

      // 2. Fetch their specific PAID appointments
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_email", session.user.email)
        .eq("status", "paid")
        .order("appointment_date", { ascending: true });

      if (!error && data) {
        setAppointments(data);
      }
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
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

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 border-b border-[#3A3A38]/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.35em] text-[#88B7B5]">Patient Portal</p>
            <h1 className="font-serif text-4xl font-medium text-[#2C4C5B]">My Appointments</h1>
          </div>
          <button onClick={handleLogout} className="rounded-full border border-[#A65D47]/30 px-6 py-2 text-xs font-semibold uppercase tracking-widest text-[#A65D47] transition-colors hover:bg-[#A65D47]/5">
            Log Out
          </button>
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
              
              // Exactly 15 minutes before
              const activationTime = new Date(startTime.getTime() - 15 * 60000); 

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

                    {/* NEW: Post-Session Homework Block */}
                    {apt.homework && (
                      <div className="mt-6 rounded-2xl bg-[#88B7B5]/10 p-5 border border-[#88B7B5]/20 max-w-xl">
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#2C4C5B] flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                          Post-Session Tasks
                        </p>
                        <p className="text-sm text-[#3A3A38]/80 whitespace-pre-wrap leading-relaxed">{apt.homework}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Column (Google Meet or Directions) */}
                  {!isPast && (
                    <div className="flex flex-col items-start gap-2 border-t border-[#3A3A38]/10 pt-6 sm:items-end sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                      {apt.modality === 'online' ? (
                        <>
                          <button 
                            disabled={!isLinkActive || !apt.meeting_link}
                            onClick={() => window.open(apt.meeting_link, "_blank")}
                            className={`w-full whitespace-nowrap rounded-full px-8 py-3 text-sm font-semibold tracking-wide transition-all sm:w-auto 
                              ${isLinkActive && apt.meeting_link ? 'bg-[#2C4C5B] text-[#FBF8F2] hover:-translate-y-1 hover:shadow-lg' : 'cursor-not-allowed bg-[#2C4C5B]/10 text-[#2C4C5B]/40'}`}
                          >
                            {isLinkActive && apt.meeting_link ? "Join Video Session" : "Link Activates 15m Prior"}
                          </button>
                          {!isLinkActive && <p className="text-[10px] uppercase tracking-widest text-[#3A3A38]/50">Check back closer to start time</p>}
                        </>
                      ) : (
                        <div className="rounded-xl bg-[#FBF8F2] p-4 text-left sm:text-right text-sm border border-[#3A3A38]/10">
                          <p className="font-semibold text-[#2C4C5B]">In-Person Session</p>
                          <p className="mt-1 text-xs text-[#3A3A38]/70">Please arrive at the clinic 15 minutes prior to your appointment time.</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}