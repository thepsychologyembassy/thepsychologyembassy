"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { supabase } from "../../lib/supabase";
import { client, urlFor } from "../../lib/sanity";
import Navbar from "../../components/Navbar";

interface Counselor {
  _id: string;
  name: string;
  designation: string;
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

interface Testimonial { _id: string; quote: string; name: string; }

const formatTime = (hour: number) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h < 10 ? '0' : ''}${h}:00 ${ampm}`;
};

// Privacy Helper: Converts "Jane Doe" to "J. D."
const anonymizeName = (name: string) => {
  if (!name) return "Anonymous Client";
  return name.split(" ").map(n => n[0]).join(". ") + ".";
};

export default function BookPage() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true); 
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  
  const [selectedCounselorId, setSelectedCounselorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [bookedSlots, setBookedSlots] = useState<number[]>([]); // Tracks taken time slots
  const [modality, setModality] = useState<string>("online");
  
  const [patientData, setPatientData] = useState({
    full_name: "", user_email: "", message: "",
  });

  // CALENDAR LOGIC: Starts from Tomorrow
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const minDate = new Date(tomorrowObj.getTime() - tomorrowObj.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const maxDateObj = new Date(tomorrowObj);
  maxDateObj.setDate(tomorrowObj.getDate() + 6);
  const maxDate = new Date(maxDateObj.getTime() - maxDateObj.getTimezoneOffset() * 60000).toISOString().split("T")[0];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          setPatientData(prev => ({ ...prev, user_email: user.email || "" }));
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsAuthChecking(false);
      }

      try {
        // NEW: Added the order(orderRank) logic here to respect Sanity's drag-and-drop
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
      if (session?.user) {
        setUser(session.user);
        setPatientData(prev => ({ ...prev, user_email: session.user.email || "" }));
      } else {
        setUser(null);
      }
      setIsAuthChecking(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Double-Booking Prevention Sync
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedCounselorId || !selectedDate) {
        setBookedSlots([]);
        return;
      }
      const { data, error } = await supabase
        .from("appointments")
        .select("time_slots")
        .eq("counselor_id", selectedCounselorId)
        .eq("appointment_date", selectedDate)
        .eq("status", "paid")
        .in("status", ["paid", "pending"]); // Blocks paid sessions and ones currently in checkout

      
      if (data && !error) {
        // Flatten the arrays of booked hours into one single array
        const taken = data.flatMap((apt: any) => apt.time_slots);
        setBookedSlots(taken);
      }
    };
    fetchBookedSlots();
  }, [selectedCounselorId, selectedDate]);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => setCurrentIndex((prev) => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, [currentIndex, testimonials.length]);

  const selectedCounselor = counselors.find(c => c._id === selectedCounselorId);
  const totalPrice = selectedCounselor ? selectedCounselor.fees * selectedSlots.length : 0;
  const isDateBlocked = selectedCounselor?.blockedDates?.includes(selectedDate);

  // Group Counselors by Designation for the 3-Column Grid
  const groupedCounselors = counselors.reduce((acc, counselor) => {
    const title = counselor.designation || "Counselor";
    (acc[title] = acc[title] || []).push(counselor);
    return acc;
  }, {} as Record<string, Counselor[]>);

  const availableHours = [];
  if (selectedCounselor && !isDateBlocked) {
    const start = selectedCounselor.shiftStart || 12; 
    const end = selectedCounselor.shiftEnd || 20;     
    for (let i = start; i < end; i++) availableHours.push(i);
  }

  const handlePatientChange = (e: any) => {
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  const handleCounselorChange = (e: any) => {
    const cid = e.target.value;
    setSelectedCounselorId(cid);
    setSelectedSlots([]);
    const counselor = counselors.find(c => c._id === cid);
    if (counselor) setModality(counselor.mode === "in-person" ? "in-person" : "online");
  };

  const toggleTimeSlot = (hour: number) => {
    setSelectedSlots(prev => prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour].sort((a, b) => a - b));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setStatusMessage("Please log in first.");
    if (!selectedCounselor || !selectedDate || selectedSlots.length === 0) return setStatusMessage("Incomplete selection.");

    setIsSubmitting(true);
    setStatusMessage("Securing your slot...");

    const payload = {
      patient_name: patientData.full_name,
      patient_email: user.email, 
      patient_notes: patientData.message,
      counselor_id: selectedCounselorId,
      counselor_name: selectedCounselor.name,
      appointment_date: selectedDate,
      time_slots: selectedSlots,
      modality: modality,
      total_price: totalPrice,
      payment_gateway: "payu", 
      status: "pending"
    };

    const { data: dbData, error: dbError } = await supabase.from("appointments").insert([payload]).select().single();
    
    if (dbError) {
      setStatusMessage("Something went wrong saving the appointment.");
      setIsSubmitting(false);
      return;
    }

    setStatusMessage("Redirecting to PayU Secure Checkout...");
    
    try {
      // 1. Fetch Secure Hash (Sending IDs instead of Price)
      const res = await fetch("/api/payu/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          firstname: patientData.full_name,
          email: user.email,
          productinfo: `Session with ${selectedCounselor.name}`,
          counselor_id: selectedCounselorId,
          slots_count: selectedSlots.length
        }),
      });
      
      // Extract the secure amount calculated by the server
      const { hash, txnid, key, amount } = await res.json();
      if (!hash) throw new Error("No Hash Generated");

      // 2. Build Dynamic Form & Submit to PayU
      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      
      form.setAttribute("action", "https://secure.payu.in/_payment");

      const appendInput = (name: string, value: any) => {
        const input = document.createElement("input");
        input.setAttribute("type", "hidden");
        input.setAttribute("name", name);
        input.setAttribute("value", value);
        form.appendChild(input);
      };

      appendInput("key", key);
      appendInput("txnid", txnid);
      appendInput("amount", amount); // <-- USE SECURE SERVER AMOUNT HERE
      appendInput("productinfo", `Session with ${selectedCounselor.name}`);
      appendInput("firstname", patientData.full_name);
      appendInput("email", user.email);
      appendInput("phone", "9999999999"); // PayU requires a phone number fallback
      appendInput("surl", `${window.location.origin}/api/payu/response?appointment_id=${dbData.id}`);
      appendInput("furl", `${window.location.origin}/api/payu/response?appointment_id=${dbData.id}`);
      appendInput("hash", hash);

      document.body.appendChild(form);
      form.submit();
      
    } catch (err) {
      setStatusMessage("Error launching PayU.");
      setIsSubmitting(false);
    }
  };

  const getVisibleTestimonials = () => {
    if (testimonials.length === 0) return [];
    if (testimonials.length === 1) return [testimonials[0]];
    return [testimonials[currentIndex], testimonials[(currentIndex + 1) % testimonials.length]];
  };

  return (
    <main className="relative isolate min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />
      {/* 1. HERO */}
      <section className="relative h-[50vh] w-full overflow-hidden sm:h-[70vh]">
        <div className="fixed inset-0 -z-10 h-screen w-full pointer-events-none">
          <video className="h-full w-full object-cover opacity-90" autoPlay muted loop playsInline>
            <source src="/videos/beach-waves.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A5F]/20 via-[#FBF8F2]/40 to-[#FBF8F2]" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-20 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.35em] text-[#2C4C5B] drop-shadow-sm">Find Your Calm</p>
          <h1 className="max-w-4xl font-serif text-4xl font-medium leading-tight text-[#3A3A38] sm:text-6xl">A Safe Harbor.</h1>
        </div>
      </section>

      {/* 2. DYNAMIC COUNSELORS SECTION (NEW 3-COLUMN GRID) */}
      <section className="relative z-10 mx-auto -mt-10 w-full max-w-6xl px-6 pb-24 sm:-mt-20">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-3xl font-medium text-[#3A3A38] sm:text-4xl">Meet Our Team</h2>
          <p className="mt-4 text-sm uppercase tracking-widest text-[#3A3A38]/60">Find the right specialist to guide your journey.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><p className="animate-pulse text-sm uppercase tracking-widest text-[#88B7B5]">Loading Profiles...</p></div>
        ) : (
          <div className="flex flex-col gap-16">
            {Object.entries(groupedCounselors).map(([designation, list]) => (
              <div key={designation}>
                <h3 className="mb-6 border-b border-[#3A3A38]/10 pb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#4F6F52]">
                  {designation}s
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {list.map(c => (
                    <div key={c._id} className="flex flex-col overflow-hidden rounded-3xl border border-[#3A3A38]/10 bg-white/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                      <div className="relative h-48 w-full bg-[#88B7B5]/20">
                        {c.image && <Image src={urlFor(c.image).url()} alt={c.name} fill className="object-contain p-2" />}
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <h4 className="font-serif text-xl font-medium text-[#2C4C5B]">{c.name}</h4>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {c.experience && (
                            <span className="flex items-center rounded-md bg-[#88B7B5]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#2C4C5B]">
                              {c.experience} Yrs Exp
                            </span>
                          )}
                        <span className="flex items-center rounded-md bg-[#F6D86B]/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#8E7A65]">
                          {c.sessionsCompleted} Sessions
                        </span>
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

      {/* 3. THE SMART BOOKING FORM */}
      <section id="booking-form" className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl border border-[#88B7B5]/30 bg-white/60 shadow-[0_8px_40px_rgba(44,76,91,0.05)] backdrop-blur-xl">
          
          <div className="border-b border-[#88B7B5]/20 bg-[#88B7B5]/10 px-8 py-8 sm:px-12">
            <h2 className="font-serif text-2xl font-medium text-[#2C4C5B]">Schedule Your Session</h2>
            <p className="mt-2 text-sm text-[#3A3A38]/70">Select your counselor and build a schedule that works for you.</p>
          </div>

          {isAuthChecking ? (
            <div className="flex flex-col items-center justify-center px-8 py-20 text-center sm:px-12">
              <p className="animate-pulse text-sm font-medium uppercase tracking-[0.35em] text-[#88B7B5]">Verifying Secure Session...</p>
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center justify-center px-8 py-20 text-center sm:px-12">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#88B7B5]/20 text-[#2C4C5B]">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h3 className="mb-2 font-serif text-2xl font-medium text-[#3A3A38]">Authentication Required</h3>
              <p className="mb-8 max-w-md text-sm text-[#3A3A38]/70">To ensure your privacy and secure your appointment slots, please log in or create an account to continue.</p>
              <div className="flex gap-4">
                <Link href="/login" className="rounded-full bg-[#2C4C5B] px-8 py-3 text-sm font-medium tracking-wide text-[#FBF8F2] transition-transform hover:-translate-y-1 hover:shadow-lg">
                  Log In
                </Link>
                <Link href="/signup" className="rounded-full border border-[#2C4C5B] px-8 py-3 text-sm font-medium tracking-wide text-[#2C4C5B] transition-colors hover:bg-[#2C4C5B]/5">
                  Sign Up
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-10 px-8 py-10 sm:px-12">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">1. Select Counselor</label>
                  <div className="relative">
                    <select required value={selectedCounselorId} onChange={handleCounselorChange} className="w-full appearance-none rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 pr-10 text-[#3A3A38] focus:border-[#4F6F52] focus:outline-none focus:ring-1 focus:ring-[#4F6F52]">
                      <option value="" disabled>Choose a Counselor...</option>
                      {counselors.map(c => <option key={c._id} value={c._id}>{c.name} (₹{c.fees}/session)</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#3A3A38]/50">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">2. Select Date (From Tomorrow)</label>
                  <input type="date" min={minDate} max={maxDate} required disabled={!selectedCounselorId} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlots([]); }} className="w-full rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:outline-none focus:ring-1 focus:ring-[#4F6F52] disabled:opacity-40" />
                </div>
              </div>

              {selectedCounselorId && selectedDate && (
                <div className="flex flex-col gap-4 border-t border-[#3A3A38]/10 pt-8">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">3. Select Time Slots <span className="normal-case tracking-normal">(45 mins - 1 hour)</span></label>
                  {isDateBlocked ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{selectedCounselor?.name} is unavailable on this date.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 text-center">
                      {availableHours.map((hour) => {
                        const isSelected = selectedSlots.includes(hour);
                        const isTaken = bookedSlots.includes(hour); // Double-booking check
                        
                        return (
                          <button 
                            key={hour} 
                            type="button" 
                            disabled={isTaken}
                            onClick={() => toggleTimeSlot(hour)} 
                            className={`rounded-xl border py-3 text-sm font-medium transition-all duration-200 
                              ${isTaken ? 'border-red-100 bg-red-50/50 text-red-300 cursor-not-allowed line-through' : 
                                isSelected ? "border-[#4F6F52] bg-[#4F6F52] text-white shadow-md scale-105" : 
                                "border-[#3A3A38]/20 bg-white/50 text-[#3A3A38]/70 hover:border-[#4F6F52]/50 hover:bg-white"}`}
                          >
                            {formatTime(hour)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {!isDateBlocked && availableHours.length === 0 && <p className="text-sm text-[#3A3A38]/60">No available time slots left for this date.</p>}
                </div>
              )}

              {selectedCounselor?.mode === "both" && (
                <div className="flex flex-col gap-3 border-t border-[#3A3A38]/10 pt-8">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">Meeting Preference</label>
                  <div className="flex gap-6">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#3A3A38]"><input type="radio" name="modality" value="online" checked={modality === "online"} onChange={() => setModality("online")} className="h-4 w-4 accent-[#88B7B5]" /> Google Meet</label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#3A3A38]"><input type="radio" name="modality" value="in-person" checked={modality === "in-person"} onChange={() => setModality("in-person")} className="h-4 w-4 accent-[#88B7B5]" /> In-Person Clinic</label>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-6 border-t border-[#3A3A38]/10 pt-8">
                <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">4. Your Information</label>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <input type="text" name="full_name" required value={patientData.full_name} onChange={handlePatientChange} placeholder="Full Name" className="w-full rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:outline-none" />
                  <input type="email" name="user_email" disabled value={patientData.user_email} className="w-full rounded-xl border border-[#3A3A38]/10 bg-[#3A3A38]/5 px-4 py-3 text-[#3A3A38]/70 cursor-not-allowed" />
                </div>
                <textarea name="message" rows={2} value={patientData.message} onChange={handlePatientChange} placeholder="Anything we should know? (Optional)" className="w-full resize-none rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:outline-none" />
              </div>

              <div className="flex flex-col gap-8 border-t border-[#3A3A38]/10 pt-8">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">Total Cost</p>
                    <p className="font-serif text-3xl font-medium text-[#4F6F52]">₹{totalPrice.toLocaleString()} <span className="text-sm font-normal text-[#3A3A38]/60">({selectedSlots.length} sessions)</span></p>
                  </div>
                  <button type="submit" disabled={isSubmitting || !selectedCounselorId || !selectedDate || selectedSlots.length === 0} className="w-full rounded-full bg-[#2C4C5B] px-8 py-4 text-sm font-medium tracking-wide text-[#FBF8F2] transition-transform hover:-translate-y-1 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                    {isSubmitting ? "Processing..." : "Confirm & Pay with PayU"}
                  </button>
                </div>
                {statusMessage && <p className={`text-center text-sm font-medium ${statusMessage.includes("Success") || statusMessage.includes("Confirmed") ? "text-[#4F6F52]" : "text-[#A65D47]"}`}>{statusMessage}</p>}
              </div>
            </form>
          )}
        </div>
      </section>

      {/* 4. ANONYMIZED TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="relative z-10 w-full bg-[#4F6F52]/5 px-6 py-24 sm:px-12">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="mb-12 font-serif text-3xl font-medium text-[#3A3A38]">Stories of Growth</h2>
            
            <div className="block sm:hidden">
              <div className="flex flex-col items-center rounded-3xl border border-[#3A3A38]/10 bg-white p-8 shadow-sm">
                <span className="mb-4 font-serif text-5xl text-[#88B7B5]">"</span>
                <p className="mb-6 text-sm italic leading-relaxed text-[#3A3A38]/80">{testimonials[currentIndex].quote}</p>
                {/* Applied Confidentiality Filter */}
                <p className="font-semibold tracking-widest text-[#2C4C5B]">{anonymizeName(testimonials[currentIndex].name)}</p>
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
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#2C4C5B]">{anonymizeName(test.name)}</p>
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