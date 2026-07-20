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

// GET ?appointmentId= — used by the dashboard to know whether feedback was
// already left for a past session (so the form isn't shown twice).
export async function GET(request: Request) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get("appointmentId");
  if (!appointmentId) return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });

  const { data, error: dbError } = await supabaseAdmin
    .from("session_feedback")
    .select("*")
    .eq("appointment_id", appointmentId)
    .eq("patient_email", user!.email!.toLowerCase().trim())
    .maybeSingle();

  if (dbError) return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  return NextResponse.json({ feedback: data || null });
}

export async function POST(request: Request) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { appointmentId, rating, feedbackText, wantsToContinue } = await request.json();

  if (!appointmentId || typeof rating !== "number" || rating < 1 || rating > 5 || typeof wantsToContinue !== "boolean") {
    return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
  }

  const patientEmail = user!.email!.toLowerCase().trim();

  const { data: appointment, error: fetchError } = await supabaseAdmin
    .from("appointments")
    .select("id, patient_email, counselor_id, counselor_email, counselor_name")
    .eq("id", appointmentId)
    .single();

  if (fetchError || !appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  if (appointment.patient_email !== patientEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error: upsertError } = await supabaseAdmin
    .from("session_feedback")
    .upsert(
      {
        appointment_id: appointmentId,
        patient_email: patientEmail,
        counselor_id: appointment.counselor_id,
        counselor_email: appointment.counselor_email,
        counselor_name: appointment.counselor_name,
        rating,
        feedback_text: feedbackText || null,
        wants_to_continue: wantsToContinue,
      },
      { onConflict: "appointment_id" }
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  return NextResponse.json({ success: true, feedback: data });
}
