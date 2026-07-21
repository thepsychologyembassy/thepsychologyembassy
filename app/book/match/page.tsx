"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { client, urlFor } from "../../../lib/sanity";
import Navbar from "../../../components/Navbar";

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

const formatTime = (hour: number) => {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h < 10 ? "0" : ""}${h}:00 ${ampm}`;
};

function MatchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const paymentFlag = searchParams.get("payment"); // 'cancelled' | 'error' | null

  // "Continue with this psychologist?" flows (from post-session feedback,
  // or the "Book a Session" shortcut on the dashboard). rebook=1 + counselor
  // skips the intake/matching step entirely and jumps straight to
  // scheduling with that one psychologist. reselect=1 re-opens an already
  // "converted" intake session so its top-3 list can be picked from again.
  const rebookCounselorId = searchParams.get("counselor");
  const isRebook = searchParams.get("rebook") === "1" && !!rebookCounselorId;
  const isReselect = searchParams.get("reselect") === "1";

  const [isResolving, setIsResolving] = useState(true);
  const [intakeSession, setIntakeSession] = useState<any>(null);
  const [rebookUser, setRebookUser] = useState<any>(null);
  const [matchedCounselors, setMatchedCounselors] = useState<Counselor[]>([]);
  const [matchReasoning, setMatchReasoning] = useState<Record<string, string>>({});

  const [selectedCounselorId, setSelectedCounselorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [bookedSlots, setBookedSlots] = useState<number[]>([]);
  const [modality, setModality] = useState<string>("online");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Coupon state. couponStatus reflects the last "Apply" click, purely for
  // showing a live preview of the discount - it is NOT what gets trusted at
  // checkout. handleCheckout always re-validates whatever is currently in
  // couponInput itself, so an edited-but-not-reapplied code can never slip
  // through, and the /api/payu/hash endpoint re-validates again server-side
  // regardless of what the client sends.
  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [couponError, setCouponError] = useState("");
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState(0);

  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const minDate = new Date(tomorrowObj.getTime() - tomorrowObj.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
  const maxDateObj = new Date(tomorrowObj);
  maxDateObj.setDate(tomorrowObj.getDate() + 6);
  const maxDate = new Date(maxDateObj.getTime() - maxDateObj.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const redirectTarget = isRebook
          ? `/book/match?counselor=${rebookCounselorId}&rebook=1`
          : `/book/match?session=${sessionId}`;
        router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
        return;
      }

      // ── Rebook: "continue with this psychologist" ──────────────────
      // Skip intake/matching entirely. Fetch just that one counselor and
      // go straight to the scheduler, using the logged-in user's own info.
      if (isRebook) {
        const counselor: Counselor | null = await client.fetch(
          `*[_type == "counselor" && _id == $id][0]`,
          { id: rebookCounselorId },
          { cache: "no-store" }
        );

        if (!counselor) {
          router.push("/book");
          return;
        }

        setRebookUser(user);
        setMatchedCounselors([counselor]);
        setSelectedCounselorId(counselor._id);
        setModality(counselor.mode === "in-person" ? "in-person" : "online");
        setIsResolving(false);
        setTimeout(() => {
          document.getElementById("scheduler")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
        return;
      }

      // ── Normal / reselect: resolve an intake session ────────────────
      if (!sessionId) {
        router.push("/book/intake");
        return;
      }

      const { data: session, error } = await supabase
        .from("intake_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !session) {
        router.push("/book/intake");
        return;
      }

      if (session.status === "draft") {
        router.replace(`/book/intake?session=${sessionId}`);
        return;
      }
      // A "converted" session normally means they already booked from it —
      // send them to the dashboard, UNLESS they're here to reselect a
      // different psychologist from their original top-3 after feedback.
      if (session.status === "converted" && !isReselect) {
        router.replace("/dashboard");
        return;
      }

      setIntakeSession(session);
      setMatchReasoning(session.match_reasoning || {});

      if (session.selected_counselor_id && !isReselect) {
        setSelectedCounselorId(session.selected_counselor_id);
      }

      const ids: string[] = session.matched_counselor_ids || [];
      if (ids.length > 0) {
        const fetched: Counselor[] = await client.fetch(
          `*[_type == "counselor" && _id in $ids]`,
          { ids }
        );
        // Preserve the ranked order returned by the matcher, not Sanity's order.
        const ordered = ids
          .map((id) => fetched.find((c) => c._id === id))
          .filter(Boolean) as Counselor[];
        setMatchedCounselors(ordered);
      }

      setIsResolving(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isRebook, rebookCounselorId, isReselect]);

  // Double-booking prevention sync (same as the old booking form), plus
  // slots the counselor has manually blocked off.
  useEffect(() => {
  const fetchBookedSlots = async () => {
    if (!selectedCounselorId || !selectedDate) {
      setBookedSlots([]);
      return;
    }

    const [
      { data: rpcData, error: rpcError }, 
      { data: blocked }
    ] = await Promise.all([
      // 1. Fetch patient bookings securely via RPC
      supabase.rpc("get_counselor_booked_slots", {
        p_counselor_id: selectedCounselorId,
        p_appointment_date: selectedDate,
      }),
      // 2. Fetch counselor's manual blocks
      supabase
        .from("blocked_slots")
        .select("hour")
        .eq("counselor_id", selectedCounselorId)
        .eq("slot_date", selectedDate),
    ]);

    if (rpcError) {
      console.error("Failed to fetch availability:", rpcError);
    }

    // Extract the flat hours from both sources
    const bookedHours = rpcData ? rpcData.map((row: any) => row.booked_hour) : [];
    const blockedHours = blocked ? blocked.map((b: any) => b.hour) : [];

    // Merge and deduplicate
    setBookedSlots([...new Set([...bookedHours, ...blockedHours])]);
  };

  fetchBookedSlots();
}, [selectedCounselorId, selectedDate]);

  const selectedCounselor = matchedCounselors.find((c) => c._id === selectedCounselorId);
  const totalPrice = selectedCounselor ? selectedCounselor.fees * selectedSlots.length : 0;
  const discountedTotal = appliedDiscountPercent > 0
    ? Math.round((totalPrice - totalPrice * (appliedDiscountPercent / 100)) * 100) / 100
    : totalPrice;
  const isDateBlocked = selectedCounselor?.blockedDates?.includes(selectedDate);

  const availableHours: number[] = [];
  if (selectedCounselor && !isDateBlocked) {
    const start = selectedCounselor.shiftStart || 12;
    const end = selectedCounselor.shiftEnd || 20;
    for (let i = start; i < end; i++) availableHours.push(i);
  }

  const toggleTimeSlot = (hour: number) => {
    setSelectedSlots((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour].sort((a, b) => a - b)
    );
  };

  const chooseCounselor = async (id: string) => {
    setSelectedCounselorId(id);
    setSelectedDate("");
    setSelectedSlots([]);
    const counselor = matchedCounselors.find((c) => c._id === id);
    if (counselor) setModality(counselor.mode === "in-person" ? "in-person" : "online");

    if (sessionId) {
      await supabase
        .from("intake_sessions")
        .update({
          selected_counselor_id: id,
          status: "selected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    }

    setTimeout(() => {
      document.getElementById("scheduler")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Live preview only - lets the user see "✓ 15% off applied" and the
  // discounted price before they hit checkout. Not trusted for the actual
  // charge; see the re-validation inside handleCheckout below.
  const applyCoupon = async () => {
    const patientEmail = intakeSession?.email || rebookUser?.email;
    if (!couponInput.trim() || !patientEmail) return;

    setCouponStatus("checking");
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), patient_email: patientEmail }),
      });
      const result = await res.json();

      if (result.valid) {
        setAppliedDiscountPercent(result.coupon.discount_percent);
        setCouponStatus("valid");
      } else {
        setAppliedDiscountPercent(0);
        setCouponStatus("invalid");
        setCouponError(result.error || "Invalid coupon.");
      }
    } catch {
      setAppliedDiscountPercent(0);
      setCouponStatus("invalid");
      setCouponError("Something went wrong checking that code.");
    }
  };

  const handleCheckout = async () => {
    if ((!intakeSession && !rebookUser) || !selectedCounselor || !selectedDate || selectedSlots.length === 0) {
      setStatusMessage("Please complete your selection.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Securing your slot...");

    const patientName = intakeSession?.full_name || rebookUser?.user_metadata?.full_name || rebookUser?.email;
    const patientEmail = intakeSession?.email || rebookUser?.email;
    const patientNotes = intakeSession?.additional_notes || null;
    const patientPhone = intakeSession?.phone || rebookUser?.user_metadata?.phone || "";
    const patientPhoneExt = intakeSession?.phone_extension || "";

    // Re-validate whatever is currently typed in the coupon field right now
    // - not the stale couponStatus from a previous "Apply" click. This
    // covers the case where someone applied a code, then edited it (or
    // typed a new one) without clicking Apply again before paying.
    // /api/payu/hash re-validates this again server-side regardless, so
    // this call is purely to give an accurate error message pre-payment.
    const trimmedCoupon = couponInput.trim();
    let couponCodeForCheckout: string | undefined = undefined;

    if (trimmedCoupon) {
      try {
        const couponRes = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: trimmedCoupon, patient_email: patientEmail }),
        });
        const couponResult = await couponRes.json();

        if (!couponResult.valid) {
          setCouponStatus("invalid");
          setCouponError(couponResult.error || "Invalid coupon.");
          setStatusMessage("Please fix your coupon code before continuing, or clear it to pay full price.");
          setIsSubmitting(false);
          return;
        }

        couponCodeForCheckout = trimmedCoupon;
        setAppliedDiscountPercent(couponResult.coupon.discount_percent);
        setCouponStatus("valid");
      } catch {
        setCouponStatus("invalid");
        setCouponError("Couldn't verify your coupon just now. Please try again.");
        setStatusMessage("Please try again.");
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      patient_name: patientName,
      patient_email: patientEmail,
      patient_notes: patientNotes,
      counselor_id: selectedCounselor._id,
      counselor_email: selectedCounselor.email,
      counselor_name: selectedCounselor.name,
      appointment_date: selectedDate,
      time_slots: selectedSlots,
      modality,
      total_price: totalPrice,
      payment_gateway: "payu",
      status: "pending",
      intake_session_id: sessionId || null,
    };

    const { data: dbData, error: dbError } = await supabase
      .from("appointments")
      .insert([payload])
      .select()
      .single();

    if (dbError) {
      setStatusMessage("Something went wrong saving the appointment.");
      setIsSubmitting(false);
      return;
    }

    setStatusMessage("Redirecting to PayU Secure Checkout...");

    try {
      const res = await fetch("/api/payu/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: patientName,
          email: patientEmail,
          productinfo: `Session with ${selectedCounselor.name}`,
          counselor_id: selectedCounselor._id,
          slots_count: selectedSlots.length,
          appointment_id: dbData.id,
          coupon_code: couponCodeForCheckout,
        }),
      });

      const { hash, txnid, key, amount, error: hashError } = await res.json();
      if (!hash) throw new Error(hashError || "No Hash Generated");

      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", "https://secure.payu.in/_payment");

      const appendInput = (name: string, value: any) => {
        const input = document.createElement("input");
        input.setAttribute("type", "hidden");
        input.setAttribute("name", name);
        input.setAttribute("value", value ?? "");
        form.appendChild(input);
      };

      appendInput("key", key);
      appendInput("txnid", txnid);
      appendInput("amount", amount);
      appendInput("productinfo", `Session with ${selectedCounselor.name}`);
      appendInput("firstname", patientName);
      appendInput("email", patientEmail);
      // Real phone number from the intake form, with the extension appended
      // if one was given (this used to be a hardcoded placeholder).
      appendInput("phone", patientPhoneExt ? `${patientPhone}x${patientPhoneExt}` : patientPhone);
      appendInput("udf1", dbData.id);
      appendInput("surl", `${window.location.origin}/api/payu/response`);
      appendInput("furl", `${window.location.origin}/api/payu/response`);
      appendInput("hash", hash);

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setStatusMessage("Error launching PayU.");
      setIsSubmitting(false);
    }
  };

  if (isResolving) {
    return (
      <main className="min-h-screen bg-[#FBF8F2]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <p className="animate-pulse text-sm font-medium uppercase tracking-[0.35em] text-[#88B7B5]">
            Loading Your Matches...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />
      <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-32 sm:px-12">
        {!isRebook && (
          <div className="mb-4">
            <Link
              href={`/book/intake?session=${sessionId}`}
              className="group flex w-fit items-center gap-2 text-sm font-medium uppercase tracking-widest text-[#3A3A38]/50 transition-colors hover:text-[#2C4C5B]"
            >
              <span className="transition-transform group-hover:-translate-x-1">←</span> Edit Your Answers
            </Link>
          </div>
        )}

        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.35em] text-black">
            {isRebook ? "Book Again" : "Your Matches"}
          </p>
          <h1 className="font-serif text-3xl font-medium text-black sm:text-4xl">
            {isRebook ? `Continue your care with ${matchedCounselors[0]?.name || "your psychologist"}` : "We think these 3 can help you most"}
          </h1>
          <p className="mt-4 text-sm text-[#3A3A38]/70">
            {isRebook
              ? "Pick a new date and time to schedule your next session."
              : "Based on what you shared, including at least one Clinical Psychologist."}
          </p>
        </div>

        {paymentFlag === "cancelled" && (
          <div className="mx-auto mb-10 max-w-2xl rounded-xl border border-[#A65D47]/30 bg-[#A65D47]/10 p-4 text-center text-sm text-[#A65D47]">
            Your payment was cancelled. No amount was charged — pick a time again below whenever you&apos;re ready.
          </div>
        )}
        {paymentFlag === "error" && (
          <div className="mx-auto mb-10 max-w-2xl rounded-xl border border-[#A65D47]/30 bg-[#A65D47]/10 p-4 text-center text-sm text-[#A65D47]">
            Something went wrong confirming your payment. Please try again — you have not been charged.
          </div>
        )}

        <div className={`grid grid-cols-1 gap-6 ${isRebook ? "mx-auto max-w-sm" : "sm:grid-cols-3"}`}>
          {matchedCounselors.map((c) => {
            const isSelected = selectedCounselorId === c._id;
            const isClinical = (c.designation || "").toLowerCase().includes("clinical");
            return (
              <div
                key={c._id}
                className={`flex flex-col overflow-hidden rounded-3xl border bg-white/60 shadow-sm transition-all ${
                  isSelected ? "border-[#4F6F52] ring-2 ring-[#4F6F52]" : "border-[#3A3A38]/10"
                }`}
              >
                <div className="relative h-48 w-full bg-[#88B7B5]/20">
                  {c.image && (
                    <Image src={urlFor(c.image).url()} alt={c.name} fill className="object-contain p-2" />
                  )}
                  {isClinical && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#2C4C5B] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                      Clinical
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h4 className="font-serif text-xl font-medium text-[#2C4C5B]">{c.name}</h4>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#4F6F52]">
                    {c.designation}
                  </p>
                  {c.speciality && (
                    <span className="mt-2 inline-block rounded-md bg-[#4F6F52]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#4F6F52]">
                      {c.speciality}
                    </span>
                  )}
                  <p className="mt-3 text-xs leading-relaxed text-[#3A3A38]/70 line-clamp-4">{c.bio}</p>
                  {matchReasoning[c._id] && (
                    <p className="mt-3 rounded-lg bg-[#F6D86B]/15 px-3 py-2 text-[11px] italic text-[#8E7A65]">
                      {matchReasoning[c._id]}
                    </p>
                  )}

                  <div className="mt-6 flex flex-col gap-3 border-t border-[#3A3A38]/10 pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#4F6F52]">₹{c.fees}/hr</p>
                      <Link
                        href={`/counselors/${c._id}`}
                        target="_blank"
                        className="text-xs font-semibold uppercase tracking-wider text-[#2C4C5B] underline"
                      >
                        View Profile
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => chooseCounselor(c._id)}
                      className={`w-full rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                        isSelected
                          ? "bg-[#4F6F52] text-white"
                          : "border border-[#2C4C5B]/20 text-[#2C4C5B] hover:bg-[#2C4C5B] hover:text-white"
                      }`}
                    >
                      {isSelected ? "Selected" : "Choose This Psychologist"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedCounselor && (
          <div
            id="scheduler"
            className="mx-auto mt-16 w-full max-w-4xl overflow-hidden rounded-3xl border border-[#88B7B5]/30 bg-white/60 shadow-[0_8px_40px_rgba(44,76,91,0.05)] backdrop-blur-xl"
          >
            <div className="border-b border-[#88B7B5]/20 bg-[#88B7B5]/10 px-8 py-8 sm:px-12">
              <h2 className="font-serif text-2xl font-medium text-[#2C4C5B]">
                Schedule with {selectedCounselor.name}
              </h2>
              <p className="mt-2 text-sm text-[#3A3A38]/70">Pick a date and the time slots that work for you.</p>
            </div>

            <div className="flex flex-col gap-10 px-8 py-10 sm:px-12">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                  Select Date (From Tomorrow)
                </label>
                <input
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlots([]);
                  }}
                  className="w-full rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:outline-none focus:ring-1 focus:ring-[#4F6F52] sm:w-64"
                />
              </div>

              {selectedDate && (
                <div className="flex flex-col gap-4 border-t border-[#3A3A38]/10 pt-8">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                    Select Time Slots <span className="normal-case tracking-normal">(45 mins - 1 hour)</span>
                  </label>
                  {isDateBlocked ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                      {selectedCounselor.name} is unavailable on this date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4 md:grid-cols-5">
                      {availableHours.map((hour) => {
                        const isSelectedSlot = selectedSlots.includes(hour);
                        const isTaken = bookedSlots.includes(hour);
                        return (
                          <button
                            key={hour}
                            type="button"
                            disabled={isTaken}
                            onClick={() => toggleTimeSlot(hour)}
                            className={`rounded-xl border py-3 text-sm font-medium transition-all duration-200 ${
                              isTaken
                                ? "cursor-not-allowed border-red-100 bg-red-50/50 text-red-300 line-through"
                                : isSelectedSlot
                                ? "scale-105 border-[#4F6F52] bg-[#4F6F52] text-white shadow-md"
                                : "border-[#3A3A38]/20 bg-white/50 text-[#3A3A38]/70 hover:border-[#4F6F52]/50 hover:bg-white"
                            }`}
                          >
                            {formatTime(hour)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {!isDateBlocked && availableHours.length === 0 && (
                    <p className="text-sm text-[#3A3A38]/60">No available time slots left for this date.</p>
                  )}
                </div>
              )}

              {selectedCounselor.mode === "both" && (
                <div className="flex flex-col gap-3 border-t border-[#3A3A38]/10 pt-8">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                    Meeting Preference
                  </label>
                  <div className="flex gap-6">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#3A3A38]">
                      <input
                        type="radio"
                        checked={modality === "online"}
                        onChange={() => setModality("online")}
                        className="h-4 w-4 accent-[#88B7B5]"
                      />
                      Google Meet
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#3A3A38]">
                      <input
                        type="radio"
                        checked={modality === "in-person"}
                        onChange={() => setModality("in-person")}
                        className="h-4 w-4 accent-[#88B7B5]"
                      />
                      In-Person Clinic
                    </label>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-8 border-t border-[#3A3A38]/10 pt-8">
                <div className="flex flex-col gap-2 sm:max-w-xs">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">
                    Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponStatus("idle");
                        setAppliedDiscountPercent(0);
                      }}
                      placeholder="e.g. GET15OFF"
                      className="flex-1 rounded-xl border border-[#3A3A38]/20 bg-white/50 px-3 py-2 text-sm uppercase tracking-wide focus:border-[#4F6F52] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={!couponInput.trim() || couponStatus === "checking"}
                      className="rounded-xl border border-[#2C4C5B]/30 px-4 py-2 text-xs font-semibold uppercase text-[#2C4C5B] transition-colors hover:bg-[#2C4C5B] hover:text-white disabled:opacity-50"
                    >
                      {couponStatus === "checking" ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponStatus === "valid" && (
                    <p className="text-xs font-semibold text-[#4F6F52]">✓ {appliedDiscountPercent}% off applied</p>
                  )}
                  {couponStatus === "invalid" && (
                    <p className="text-xs font-semibold text-[#A65D47]">{couponError}</p>
                  )}
                </div>

                <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/60">Total Cost</p>
                    <p className="font-serif text-3xl font-medium text-[#4F6F52]">
                      {appliedDiscountPercent > 0 && (
                        <span className="mr-2 text-lg font-normal text-[#3A3A38]/40 line-through">
                          ₹{totalPrice.toLocaleString()}
                        </span>
                      )}
                      ₹{discountedTotal.toLocaleString()}{" "}
                      <span className="text-sm font-normal text-[#3A3A38]/60">
                        ({selectedSlots.length} sessions)
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isSubmitting || !selectedDate || selectedSlots.length === 0}
                    className="w-full rounded-full bg-[#2C4C5B] px-8 py-4 text-sm font-medium tracking-wide text-[#FBF8F2] transition-transform hover:-translate-y-1 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isSubmitting ? "Processing..." : "Confirm & Pay with PayU"}
                  </button>
                </div>
                {statusMessage && (
                  <p
                    className={`text-center text-sm font-medium ${
                      statusMessage.includes("Redirecting") ? "text-[#4F6F52]" : "text-[#A65D47]"
                    }`}
                  >
                    {statusMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={null}>
      <MatchPageInner />
    </Suspense>
  );
}