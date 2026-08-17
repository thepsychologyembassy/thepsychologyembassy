"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { startBookingFlow } from "../lib/bookingRedirect";

interface Option {
  label: string;
  value: number;
}

interface Question {
  questionText: string;
  helpText?: string;
  options: Option[];
}

interface AssessmentQuizProps {
  slug: string;
  title: string;
  questions: Question[];
  disclaimer?: string;
}

interface SubmitResult {
  rangeLabel: string;
  rangeDescription: string;
  showBookingCTA: boolean;
  ctaText: string;
  disclaimer?: string;
}

export default function AssessmentQuiz({ slug, title, questions, disclaimer }: AssessmentQuizProps) {
  const router = useRouter();
  const [stage, setStage] = useState<"intro" | "quiz" | "submitting" | "result" | "error">("intro");
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isBookingRouting, setIsBookingRouting] = useState(false);

  const totalQuestions = questions.length;
  const isLastQuestion = step === totalQuestions - 1;
  const canAdvance = selections[step] !== undefined;

  const handleSelect = (optionIndex: number) => {
    setSelections((prev) => ({ ...prev, [step]: optionIndex }));
  };

  const handleNext = () => {
    if (!canAdvance) return;
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setStage("submitting");
    setErrorMsg("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setErrorMsg("Your session expired. Please log in again.");
      setStage("error");
      return;
    }

    const answers = questions.map((_, i) => ({
      questionIndex: i,
      optionIndex: selections[i],
    }));

    try {
      const res = await fetch("/api/tests/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ slug, answers }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setStage("error");
        return;
      }

      setResult(data);
      setStage("result");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStage("error");
    }
  };

  const restart = () => {
    setStep(0);
    setSelections({});
    setResult(null);
    setStage("intro");
  };

  // ── Intro / disclaimer screen ──────────────────────────────────────
  if (stage === "intro") {
    return (
      <div className="rounded-2xl border border-[#3A3A38]/10 bg-[#88B7B5]/5 p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-[#3A3A38]/80">
          {disclaimer}
        </p>
        <button
          onClick={() => setStage("quiz")}
          className="mt-6 rounded-full bg-[#2C4C5B] px-8 py-4 text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-1 hover:shadow-lg"
        >
          Begin the Test ({totalQuestions} questions)
        </button>
      </div>
    );
  }

  // ── Error screen ────────────────────────────────────────────────────
  if (stage === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8">
        <p className="text-sm font-medium text-red-600">{errorMsg}</p>
        <button
          onClick={restart}
          className="mt-4 rounded-full border border-[#2C4C5B] px-6 py-3 text-sm font-semibold text-[#2C4C5B] transition-colors hover:bg-[#2C4C5B]/5"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Result screen ───────────────────────────────────────────────────
  if (stage === "result" && result) {
    return (
      <div className="rounded-2xl border border-[#3A3A38]/10 bg-white p-6 sm:p-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#88B7B5]">Your Result</p>
        <h3 className="mb-4 font-serif text-2xl font-medium text-[#2C4C5B]">{result.rangeLabel}</h3>
        <p className="mb-6 text-[15px] leading-relaxed text-[#3A3A38]/85">{result.rangeDescription}</p>

        <div className="mb-6 rounded-xl bg-[#3A3A38]/5 p-4 text-xs leading-relaxed text-[#3A3A38]/60">
          {result.disclaimer || disclaimer}
        </div>

        <div className="flex flex-wrap gap-4">
          {result.showBookingCTA && (
            <button
              type="button"
              disabled={isBookingRouting}
              onClick={async () => {
                if (isBookingRouting) return;
                setIsBookingRouting(true);
                try {
                  await startBookingFlow(router);
                } finally {
                  setIsBookingRouting(false);
                }
              }}
              className="flex items-center gap-2 rounded-full bg-[#2C4C5B] px-8 py-4 text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-1 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBookingRouting ? "Loading..." : result.ctaText}
            </button>
          )}
          <button
            onClick={restart}
            className="rounded-full border border-[#2C4C5B] px-6 py-4 text-sm font-semibold text-[#2C4C5B] transition-colors hover:bg-[#2C4C5B]/5"
          >
            Retake Test
          </button>
        </div>

        <p className="mt-6 text-xs text-[#3A3A38]/50">
          This result is saved to your <Link href="/dashboard" className="underline">dashboard</Link> so you can revisit it anytime.
        </p>
      </div>
    );
  }

  // ── Quiz / submitting screen ─────────────────────────────────────────
  const question = questions[step];
  return (
    <div className="rounded-2xl border border-[#3A3A38]/10 bg-white p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-[#3A3A38]/40">
        <span>Question {step + 1} of {totalQuestions}</span>
        <span>{title}</span>
      </div>

      <div className="mb-6 h-1.5 w-full rounded-full bg-[#3A3A38]/10">
        <div
          className="h-1.5 rounded-full bg-[#88B7B5] transition-all"
          style={{ width: `${((step + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      <h3 className="mb-2 font-serif text-xl font-medium text-[#2C4C5B] sm:text-2xl">
        {question.questionText}
      </h3>
      {question.helpText && (
        <p className="mb-4 text-sm text-[#3A3A38]/60">{question.helpText}</p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`rounded-xl border px-5 py-4 text-left text-sm font-medium transition-colors ${
              selections[step] === i
                ? "border-[#2C4C5B] bg-[#2C4C5B]/5 text-[#2C4C5B]"
                : "border-[#3A3A38]/15 text-[#3A3A38]/80 hover:border-[#88B7B5]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="text-sm font-semibold text-[#3A3A38]/50 disabled:opacity-0"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canAdvance || stage === "submitting"}
          className="rounded-full bg-[#2C4C5B] px-8 py-3 text-sm font-semibold tracking-wide text-white transition-transform hover:-translate-y-1 hover:shadow-lg disabled:pointer-events-none disabled:opacity-40"
        >
          {stage === "submitting" ? "Scoring..." : isLastQuestion ? "See My Result" : "Next"}
        </button>
      </div>
    </div>
  );
}
