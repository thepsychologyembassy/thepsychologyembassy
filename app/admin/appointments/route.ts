import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../lib/sanity";

// Service Role key so we can read across all patients/counselors, bypassing RLS.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  // 1. Get the user's session token from the request headers
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Missing token" }, { status: 401 });
  const token = authHeader.replace("Bearer ", "");

  // 2. Verify the user securely on the server
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Cross-reference with Sanity site settings, same admin allowlist used
  // by the applications dashboard.
  const settings = await client.fetch(`*[_type == "siteSettings"][0]`);
  const authorizedEmails: string[] = settings?.adminEmails || [];

  if (!authorizedEmails.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
  }

  // 4. Fetch every appointment (any status), most recent first.
  const { data: appointments, error: aptError } = await supabaseAdmin
    .from("appointments")
    .select(
      "id, patient_name, patient_email, counselor_id, counselor_name, counselor_email, appointment_date, time_slots, modality, status, total_price, discount_amount, created_at"
    )
    .order("appointment_date", { ascending: false });

  if (aptError) return NextResponse.json({ error: "Database error" }, { status: 500 });

  // 5. Fetch all feedback and attach it to its appointment, so completed
  // sessions can show what the patient said without a second round trip.
  const { data: feedbackRows, error: fbError } = await supabaseAdmin
    .from("session_feedback")
    .select("appointment_id, rating, feedback_text, wants_to_continue, created_at");

  if (fbError) return NextResponse.json({ error: "Database error (feedback)" }, { status: 500 });

  const feedbackByAppointmentId: Record<string, any> = {};
  (feedbackRows || []).forEach((fb) => {
    feedbackByAppointmentId[fb.appointment_id] = fb;
  });

  const enriched = (appointments || []).map((apt) => ({
    ...apt,
    feedback: feedbackByAppointmentId[apt.id] || null,
  }));

  return NextResponse.json({ appointments: enriched });
}
