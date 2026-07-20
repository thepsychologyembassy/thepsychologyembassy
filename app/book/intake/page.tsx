"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Navbar from "../../../components/Navbar";

const GENDER_OPTIONS = [
  { value: "man", label: "Man" },
  { value: "woman", label: "Woman" },
  { value: "transgender", label: "Transgender" },
  { value: "non_binary", label: "Non-binary" },
  { value: "self_described", label: "Prefer to self-describe" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const EMPTY_FORM = {
  full_name: "",
  age: "",
  gender: "",
  gender_self_described: "",
  email: "",
  phone: "",
  phone_extension: "",
  therapy_before: "",
  presenting_issues: "",
  therapy_expectations: "",
  additional_notes: "",
};

const inputClass =
  "w-full rounded-xl border border-[#3A3A38]/20 bg-white/50 px-4 py-3 text-[#3A3A38] focus:border-[#4F6F52] focus:outline-none focus:ring-1 focus:ring-[#4F6F52]";
const labelClass = "text-xs font-semibold uppercase tracking-widest text-black";

function IntakeFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [isResolving, setIsResolving] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login?redirect=/book/intake");
        return;
      }
      setUser(authUser);

      const paramSession = searchParams.get("session");

      const prefill = (row: any) => ({
        full_name: row.full_name || "",
        age: row.age ? String(row.age) : "",
        gender: row.gender || "",
        gender_self_described: row.gender_self_described || "",
        email: row.email || authUser.email || "",
        phone: row.phone || "",
        phone_extension: row.phone_extension || "",
        therapy_before:
          row.therapy_before === true ? "yes" : row.therapy_before === false ? "no" : "",
        presenting_issues: row.presenting_issues || "",
        therapy_expectations: row.therapy_expectations || "",
        additional_notes: row.additional_notes || "",
      });

      // Resolve which session (if any) we should be resuming.
      const { data: existing } = paramSession
        ? await supabase
            .from("intake_sessions")
            .select("*")
            .eq("id", paramSession)
            .eq("user_id", authUser.id)
            .maybeSingle()
        : await supabase
            .from("intake_sessions")
            .select("*")
            .eq("user_id", authUser.id)
            .neq("status", "converted")
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

      if (existing) {
        if (existing.status !== "draft") {
          // They already finished the form and have a match (or further)
          // sitting there — send them straight to it instead of asking again.
          router.replace(`/book/match?session=${existing.id}`);
          return;
        }
        setSessionId(existing.id);
        setForm(prefill(existing));
      } else {
        setForm((prev) => ({ ...prev, email: authUser.email || "" }));
      }

      setIsResolving(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.gender === "self_described" && !form.gender_self_described.trim()) {
      setError("Please tell us how you'd like to describe your gender.");
      return;
    }
    if (form.therapy_before === "") {
      setError("Please let us know if you've been to therapy before.");
      return;
    }
    if (!form.presenting_issues.trim()) {
      setError("Please share a bit about what you're dealing with — this is how we match you.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      user_id: user.id,
      full_name: form.full_name,
      age: parseInt(form.age, 10),
      gender: form.gender,
      gender_self_described:
        form.gender === "self_described" ? form.gender_self_described.trim() : null,
      email: form.email,
      phone: form.phone,
      phone_extension: form.phone_extension || null,
      therapy_before: form.therapy_before === "yes",
      presenting_issues: form.presenting_issues.trim(),
      therapy_expectations: form.therapy_expectations.trim() || null,
      additional_notes: form.additional_notes.trim() || null,
      status: "draft",
      updated_at: new Date().toISOString(),
    };

    let id = sessionId;

    if (id) {
      const { error: updateError } = await supabase
        .from("intake_sessions")
        .update(payload)
        .eq("id", id);
      if (updateError) {
        setError("Something went wrong saving your answers. Please try again.");
        setIsSubmitting(false);
        return;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("intake_sessions")
        .insert([payload])
        .select()
        .single();
      if (insertError || !data) {
        setError("Something went wrong saving your answers. Please try again.");
        setIsSubmitting(false);
        return;
      }
      id = data.id;
    }

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: id }),
      });
      if (!res.ok) throw new Error("Matching failed");
      router.push(`/book/match?session=${id}`);
    } catch (err) {
      setError("We couldn't find your matches just now. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isResolving) {
    return (
      <main className="min-h-screen bg-[#FBF8F2]">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <p className="animate-pulse text-sm font-medium uppercase tracking-[0.35em] text-[#88B7B5]">
            Loading Your Session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBF8F2] text-[#3A3A38]">
      <Navbar />
      <section className="mx-auto w-full max-w-3xl px-6 pb-24 pt-32 sm:px-12">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.35em] text-black">
            Intake Form
          </p>
          <h1 className="font-serif text-3xl font-medium text-black sm:text-4xl">
            Let&apos;s find the right psychologist for you
          </h1>
          <p className="mt-4 text-sm text-[#3A3A38]/70">
            A few questions so we can match you with the 3 specialists best suited to help.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-10 overflow-hidden rounded-3xl border border-[#88B7B5]/30 bg-white/60 px-8 py-10 shadow-[0_8px_40px_rgba(44,76,91,0.05)] backdrop-blur-xl sm:px-12"
        >
          {/* ABOUT YOU */}
          <div className="flex flex-col gap-6">
            <label className={labelClass}>1. About You</label>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <input
                type="text"
                name="full_name"
                required
                value={form.full_name}
                onChange={handleChange}
                placeholder="Full Name"
                className={inputClass}
              />
              <input
                type="number"
                name="age"
                min={13}
                max={120}
                required
                value={form.age}
                onChange={handleChange}
                placeholder="Age"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-[#3A3A38]">Gender</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GENDER_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      form.gender === opt.value
                        ? "border-[#4F6F52] bg-[#4F6F52]/5 text-[#3A3A38]"
                        : "border-[#3A3A38]/20 bg-white/50 text-[#3A3A38]/80 hover:border-[#4F6F52]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={opt.value}
                      checked={form.gender === opt.value}
                      onChange={handleChange}
                      required
                      className="h-4 w-4 accent-[#4F6F52]"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {form.gender === "self_described" && (
                <input
                  type="text"
                  name="gender_self_described"
                  value={form.gender_self_described}
                  onChange={handleChange}
                  placeholder="How would you describe your gender?"
                  className={inputClass}
                />
              )}
            </div>
          </div>

          {/* CONTACT */}
          <div className="flex flex-col gap-6 border-t border-[#3A3A38]/10 pt-8">
            <label className={labelClass}>2. Contact Details</label>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                className={inputClass}
              />
              <div className="flex gap-3">
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="text"
                  name="phone_extension"
                  value={form.phone_extension}
                  onChange={handleChange}
                  placeholder="Ext."
                  className={`${inputClass} w-24`}
                />
              </div>
            </div>
          </div>

          {/* THERAPY JOURNEY */}
          <div className="flex flex-col gap-6 border-t border-[#3A3A38]/10 pt-8">
            <label className={labelClass}>3. Your Therapy Journey</label>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-[#3A3A38]">
                Have you ever taken therapy before?
              </p>
              <div className="flex gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#3A3A38]">
                  <input
                    type="radio"
                    name="therapy_before"
                    value="yes"
                    checked={form.therapy_before === "yes"}
                    onChange={handleChange}
                    className="h-4 w-4 accent-[#4F6F52]"
                  />
                  Yes
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#3A3A38]">
                  <input
                    type="radio"
                    name="therapy_before"
                    value="no"
                    checked={form.therapy_before === "no"}
                    onChange={handleChange}
                    className="h-4 w-4 accent-[#4F6F52]"
                  />
                  No
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#3A3A38]">
                What are you currently dealing with?
              </p>
              <textarea
                name="presenting_issues"
                required
                rows={4}
                value={form.presenting_issues}
                onChange={handleChange}
                placeholder="Share as much or as little as you're comfortable with — this is how we match you to the right specialist."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#3A3A38]">
                What do you expect from therapy? <span className="text-[#3A3A38]/50">(Optional)</span>
              </p>
              <textarea
                name="therapy_expectations"
                rows={3}
                value={form.therapy_expectations}
                onChange={handleChange}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#3A3A38]">
                Anything else you&apos;d like to tell us? <span className="text-[#3A3A38]/50">(Optional)</span>
              </p>
              <textarea
                name="additional_notes"
                rows={3}
                value={form.additional_notes}
                onChange={handleChange}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {error && (
            <p className="text-center text-sm font-medium text-[#A65D47]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#2C4C5B] px-8 py-4 text-sm font-medium tracking-wide text-[#FBF8F2] transition-transform hover:-translate-y-1 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Finding Your Matches..." : "Find My Psychologists"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function IntakeFormPage() {
  return (
    <Suspense fallback={null}>
      <IntakeFormInner />
    </Suspense>
  );
}