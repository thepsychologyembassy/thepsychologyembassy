import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user?.email) {
    return { error: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
  }
  return { user };
}

// A client may only share a result with a psychologist they've actually
// booked (and paid for) a session with — never an arbitrary email.
async function verifyBookedCounselor(patientEmail: string, counselorEmail: string) {
  const { data } = await supabaseAdmin
    .from("appointments")
    .select("counselor_id, counselor_email, counselor_name")
    .eq("patient_email", patientEmail)
    .eq("counselor_email", counselorEmail)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();
  return data || null;
}

// POST { resultId, counselorEmail } — share a result with a booked psychologist.
export async function POST(request: Request) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { resultId, counselorEmail } = await request.json();
  if (!resultId || !counselorEmail) {
    return NextResponse.json({ error: "resultId and counselorEmail are required" }, { status: 400 });
  }

  const patientEmail = user!.email!.toLowerCase().trim();
  const targetEmail = counselorEmail.toLowerCase().trim();

  // 1. Confirm the result actually belongs to this client.
  const { data: result, error: resultError } = await supabaseAdmin
    .from("test_results")
    .select("id, client_email")
    .eq("id", resultId)
    .single();

  if (resultError || !result) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }
  if (result.client_email !== patientEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Confirm this is a psychologist the client has actually booked.
  const counselor = await verifyBookedCounselor(patientEmail, targetEmail);
  if (!counselor) {
    return NextResponse.json(
      { error: "You can only share results with a psychologist you've booked a session with." },
      { status: 403 }
    );
  }

  // 3. Record the share (idempotent — sharing twice is a no-op).
  const { error: upsertError } = await supabaseAdmin
    .from("test_result_shares")
    .upsert(
      {
        test_result_id: resultId,
        patient_email: patientEmail,
        counselor_email: targetEmail,
        counselor_id: counselor.counselor_id,
        counselor_name: counselor.counselor_name,
      },
      { onConflict: "test_result_id,counselor_email" }
    );

  if (upsertError) {
    return NextResponse.json({ error: "Could not share result" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE { resultId, counselorEmail } — revoke access to a previously shared result.
export async function DELETE(request: Request) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { resultId, counselorEmail } = await request.json();
  if (!resultId || !counselorEmail) {
    return NextResponse.json({ error: "resultId and counselorEmail are required" }, { status: 400 });
  }

  const patientEmail = user!.email!.toLowerCase().trim();
  const targetEmail = counselorEmail.toLowerCase().trim();

  const { error: deleteError } = await supabaseAdmin
    .from("test_result_shares")
    .delete()
    .eq("test_result_id", resultId)
    .eq("counselor_email", targetEmail)
    .eq("patient_email", patientEmail); // ownership check baked into the delete itself

  if (deleteError) {
    return NextResponse.json({ error: "Could not revoke share" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
