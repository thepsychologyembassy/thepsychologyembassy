import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../../lib/sanity";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Shared: verify the bearer token belongs to a logged-in Sanity counselor,
// and return that counselor's Sanity doc. Every route below scopes all
// reads/writes to this counselor's own _id, so one counselor can never
// touch another's calendar.
async function requireCounselor(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user?.email) {
    return { error: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
  }

  const email = user.email.toLowerCase().trim();
  const counselor = await client.fetch(
    `*[_type == "counselor" && email == $email][0]{ _id, email, shiftStart, shiftEnd }`,
    { email },
    { cache: "no-store" }
  );

  if (!counselor) {
    return { error: NextResponse.json({ error: "Forbidden: not a registered psychologist" }, { status: 403 }) };
  }

  return { counselor };
}

// Only the next 6 days (matching the booking window) can be blocked/unblocked.
function isWithinNext6Days(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  return diffDays >= 1 && diffDays <= 6;
}

// GET: list this counselor's blocked slots for the next 6 days.
export async function GET(request: Request) {
  const { counselor, error } = await requireCounselor(request);
  if (error) return error;

  const { data, error: dbError } = await supabaseAdmin
    .from("blocked_slots")
    .select("slot_date, hour")
    .eq("counselor_id", counselor._id)
    .gte("slot_date", new Date().toISOString().split("T")[0]);

  if (dbError) return NextResponse.json({ error: "Failed to load blocked slots" }, { status: 500 });
  return NextResponse.json({ blockedSlots: data || [] });
}

// POST: block a specific date + hour.
export async function POST(request: Request) {
  const { counselor, error } = await requireCounselor(request);
  if (error) return error;

  const { date, hour } = await request.json();
  if (!date || typeof hour !== "number") {
    return NextResponse.json({ error: "date and hour are required" }, { status: 400 });
  }
  if (!isWithinNext6Days(date)) {
    return NextResponse.json({ error: "Only the next 6 days can be blocked" }, { status: 400 });
  }

  // Refuse to block a slot that's already booked by a patient.
  const { data: existingAppointment } = await supabaseAdmin
    .from("appointments")
    .select("id")
    .eq("counselor_id", counselor._id)
    .eq("appointment_date", date)
    .in("status", ["paid", "pending"])
    .contains("time_slots", [hour])
    .maybeSingle();

  if (existingAppointment) {
    return NextResponse.json({ error: "This slot already has a booked session" }, { status: 409 });
  }

  const { error: insertError } = await supabaseAdmin
    .from("blocked_slots")
    .upsert(
      { counselor_id: counselor._id, counselor_email: counselor.email.toLowerCase().trim(), slot_date: date, hour },
      { onConflict: "counselor_id,slot_date,hour" }
    );

  if (insertError) return NextResponse.json({ error: "Failed to block slot" }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE: unblock a specific date + hour.
export async function DELETE(request: Request) {
  const { counselor, error } = await requireCounselor(request);
  if (error) return error;

  const { date, hour } = await request.json();
  if (!date || typeof hour !== "number") {
    return NextResponse.json({ error: "date and hour are required" }, { status: 400 });
  }

  const { error: deleteError } = await supabaseAdmin
    .from("blocked_slots")
    .delete()
    .eq("counselor_id", counselor._id)
    .eq("slot_date", date)
    .eq("hour", hour);

  if (deleteError) return NextResponse.json({ error: "Failed to unblock slot" }, { status: 500 });
  return NextResponse.json({ success: true });
}
