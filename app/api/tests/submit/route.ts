import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client as sanityClient } from "../../../../lib/sanity";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SubmitBody {
  slug: string;
  // One entry per question, in the same order as the Sanity `questions`
  // array: the index of the option the client picked.
  answers: { questionIndex: number; optionIndex: number }[];
}

export async function POST(request: Request) {
  try {
    // 1. Verify the caller is logged in — tests are gated content, and we
    // never want a score written against a spoofed identity.
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user?.email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body: SubmitBody = await request.json();
    if (!body?.slug || !Array.isArray(body.answers)) {
      return NextResponse.json({ error: "Malformed submission" }, { status: 400 });
    }

    // 2. Fetch the authored test from Sanity. This is the single source of
    // truth for questions, weights, and result ranges — the client never
    // sends us weights or a score, only which options they picked.
    const tool = await sanityClient.fetch(
      `*[_type == "tool" && slug.current == $slug && isAssessment == true][0]{
        title, "slug": slug.current, questions, resultRanges, assessmentDisclaimer
      }`,
      { slug: body.slug }
    );

    if (!tool) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }
    const questions = tool.questions || [];
    const resultRanges = tool.resultRanges || [];
    if (questions.length === 0 || resultRanges.length === 0) {
      return NextResponse.json({ error: "This test isn't fully configured yet" }, { status: 400 });
    }
    if (body.answers.length !== questions.length) {
      return NextResponse.json({ error: "Please answer every question" }, { status: 400 });
    }

    // 3. Score server-side from admin-defined weights only.
    let rawScore = 0;
    const answersForRecord: { questionText: string; selectedLabel: string; value: number }[] = [];

    for (const answer of body.answers) {
      const question = questions[answer.questionIndex];
      const option = question?.options?.[answer.optionIndex];
      if (!question || !option) {
        return NextResponse.json({ error: "Invalid answer selection" }, { status: 400 });
      }
      rawScore += Number(option.value) || 0;
      answersForRecord.push({
        questionText: question.questionText,
        selectedLabel: option.label,
        value: Number(option.value) || 0,
      });
    }

    // 4. Resolve the matching admin-authored range. If ranges don't cover
    // every possible score, fail loudly rather than guessing — a gap here
    // is a content error the admin needs to fix, not something to paper
    // over with a made-up result.
    const matchedRange = resultRanges.find(
      (r: any) => rawScore >= r.minScore && rawScore <= r.maxScore
    );
    if (!matchedRange) {
      return NextResponse.json(
        { error: "This test's score ranges don't cover your result. Please contact us." },
        { status: 500 }
      );
    }

    // 5. Store the record (service-role write — clients have no direct
    // insert access, see the RLS policy in supabase/migrations).
    const { data: saved, error: insertError } = await supabaseAdmin
      .from("test_results")
      .insert({
        user_id: user.id,
        client_email: user.email.toLowerCase().trim(),
        tool_slug: tool.slug,
        tool_title: tool.title,
        raw_score: rawScore,
        range_label: matchedRange.rangeLabel,
        range_description: matchedRange.resultDescription,
        answers: answersForRecord,
      })
      .select("id, created_at")
      .single();

    if (insertError || !saved) {
      return NextResponse.json({ error: "Could not save your result" }, { status: 500 });
    }

    // 6. Return only the non-diagnostic result — never the raw score.
    return NextResponse.json({
      resultId: saved.id,
      toolTitle: tool.title,
      rangeLabel: matchedRange.rangeLabel,
      rangeDescription: matchedRange.resultDescription,
      showBookingCTA: matchedRange.showBookingCTA !== false,
      ctaText: matchedRange.ctaText || "Talk to a Counsellor",
      disclaimer: tool.assessmentDisclaimer,
      createdAt: saved.created_at,
    });
  } catch (err) {
    console.error("Test submit error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
