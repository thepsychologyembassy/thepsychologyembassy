import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../../lib/sanity";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Same auth pattern as /api/counselor/blocked-slots: verify the bearer token
// belongs to a logged-in Sanity counselor, and scope every read/write to
// that counselor's own _id.
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
    `*[_type == "counselor" && email == $email][0]{ _id, email }`,
    { email },
    { cache: "no-store" }
  );

  if (!counselor) {
    return { error: NextResponse.json({ error: "Forbidden: not a registered psychologist" }, { status: 403 }) };
  }

  return { counselor };
}

function isValidWeekday(weekday: any) {
  return typeof weekday === "number" && Number.isInteger(weekday) && weekday >= 0 && weekday <= 6;
}

// Slots are quarter-hour indices within the day: 0 = 00:00 ... 95 = 23:45.
function isValidSlot(slot: any) {
  return slot === null || slot === undefined || (typeof slot === "number" && Number.isInteger(slot) && slot >= 0 && slot <= 95);
}

// GET: list this counselor's recurring rules (weekly, indefinite until removed).
export async function GET(request: Request) {
  const { counselor, error } = await requireCounselor(request);
  if (error) return error;

  const { data, error: dbError } = await supabaseAdmin
    .from("counselor_recurring_blocks")
    .select("id, weekday, slot_start")
    .eq("counselor_id", counselor._id)
    .order("weekday", { ascending: true });

  if (dbError) return NextResponse.json({ error: "Failed to load recurring blocks" }, { status: 500 });
  return NextResponse.json({ recurringBlocks: data || [] });
}

// POST: add a recurring rule. { weekday: 0-6, slot?: 0-95 | null }
// slot omitted/null => the whole day is blocked every week.
export async function POST(request: Request) {
  const { counselor, error } = await requireCounselor(request);
  if (error) return error;

  const body = await request.json();
  const { weekday, slot = null } = body;

  if (!isValidWeekday(weekday)) {
    return NextResponse.json({ error: "weekday must be an integer 0-6 (Sun-Sat)" }, { status: 400 });
  }
  if (!isValidSlot(slot)) {
    return NextResponse.json({ error: "slot must be an integer 0-95, or omitted for a whole-day block" }, { status: 400 });
  }

  const { error: insertError } = await supabaseAdmin
    .from("counselor_recurring_blocks")
    .upsert(
      {
        counselor_id: counselor._id,
        counselor_email: counselor.email.toLowerCase().trim(),
        weekday,
        slot_start: slot === undefined ? null : slot,
      },
      { onConflict: slot === null || slot === undefined ? "counselor_id,weekday" : "counselor_id,weekday,slot_start" }
    );

  if (insertError) return NextResponse.json({ error: "Failed to save recurring rule" }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE: remove a recurring rule. { weekday: 0-6, slot?: 0-95 | null }
export async function DELETE(request: Request) {
  const { counselor, error } = await requireCounselor(request);
  if (error) return error;

  const body = await request.json();
  const { weekday, slot = null } = body;

  if (!isValidWeekday(weekday)) {
    return NextResponse.json({ error: "weekday must be an integer 0-6 (Sun-Sat)" }, { status: 400 });
  }

  let query = supabaseAdmin
    .from("counselor_recurring_blocks")
    .delete()
    .eq("counselor_id", counselor._id)
    .eq("weekday", weekday);

  query = slot === null || slot === undefined ? query.is("slot_start", null) : query.eq("slot_start", slot);

  const { error: deleteError } = await query;
  if (deleteError) return NextResponse.json({ error: "Failed to remove recurring rule" }, { status: 500 });
  return NextResponse.json({ success: true });
}
