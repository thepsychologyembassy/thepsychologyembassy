import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client as sanityClient } from "../../../lib/sanity";
import { scoreAndRankCounselors, CounselorForMatch } from "../../../lib/matching";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("intake_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Intake session not found" }, { status: 404 });
    }

    const counselors: CounselorForMatch[] = await sanityClient.fetch(
      `*[_type == "counselor"]{ _id, name, designation, bio, fees, experience }`
    );

    if (!counselors || counselors.length === 0) {
      return NextResponse.json({ error: "No counselors available" }, { status: 500 });
    }

    const intakeText = [
      session.presenting_issues,
      session.therapy_expectations,
      session.additional_notes,
    ]
      .filter(Boolean)
      .join(" ");

    const ranked = scoreAndRankCounselors(intakeText, counselors);
    const matched_counselor_ids = ranked.map((r) => r.id);
    const match_reasoning = Object.fromEntries(ranked.map((r) => [r.id, r.reason]));

    const { error: updateError } = await supabaseAdmin
      .from("intake_sessions")
      .update({
        matched_counselor_ids,
        match_reasoning,
        status: "matched",
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    if (updateError) {
      console.error("Failed to save match results:", updateError);
      return NextResponse.json({ error: "Failed to save match results" }, { status: 500 });
    }

    return NextResponse.json({ matched_counselor_ids, match_reasoning });
  } catch (error) {
    console.error("Matching error:", error);
    return NextResponse.json({ error: "Matching failed" }, { status: 500 });
  }
}