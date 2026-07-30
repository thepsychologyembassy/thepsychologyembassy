import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — returns every test/tool result a client has explicitly shared with
// the requesting (logged-in) psychologist, grouped by patient email.
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const counselorEmail = user.email.toLowerCase().trim();

  const { data: shareRows, error: shareError } = await supabaseAdmin
    .from("test_result_shares")
    .select("test_result_id, patient_email, shared_at")
    .eq("counselor_email", counselorEmail);

  if (shareError) {
    return NextResponse.json({ error: "Could not load shared results" }, { status: 500 });
  }
  if (!shareRows || shareRows.length === 0) {
    return NextResponse.json({ sharedByPatient: {} });
  }

  const { data: testResults, error: resultsError } = await supabaseAdmin
    .from("test_results")
    .select("id, tool_title, range_label, range_description, created_at")
    .in("id", shareRows.map((s) => s.test_result_id));

  if (resultsError) {
    return NextResponse.json({ error: "Could not load shared results" }, { status: 500 });
  }

  const resultsById = new Map((testResults || []).map((r) => [r.id, r]));

  const sharedByPatient: Record<string, any[]> = {};
  for (const share of shareRows) {
    const result = resultsById.get(share.test_result_id);
    if (!result) continue;
    (sharedByPatient[share.patient_email] ||= []).push({
      ...result,
      shared_at: share.shared_at,
    });
  }

  return NextResponse.json({ sharedByPatient });
}
