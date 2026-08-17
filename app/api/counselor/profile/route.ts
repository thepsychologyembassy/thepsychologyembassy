import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../../lib/sanity";
import { sanityWriteClient } from "../../../../lib/sanityWrite";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Shared: verify the bearer token belongs to a logged-in Sanity counselor,
// and return that counselor's Sanity doc. Scopes every read/write below to
// this counselor's own _id - one counselor can never touch another's.
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

function isValidHour(h: any) {
  return typeof h === "number" && Number.isInteger(h) && h >= 0 && h <= 23;
}

// GET: this counselor's own working-hours settings.
export async function GET(request: Request) {
  const { counselor, error } = await requireCounselor(request);
  if (error) return error;

  return NextResponse.json({
    shiftStart: counselor.shiftStart ?? 12,
    shiftEnd: counselor.shiftEnd ?? 20,
  });
}

// PATCH: update this counselor's own working hours (shiftStart/shiftEnd).
export async function PATCH(request: Request) {
  const { counselor, error } = await requireCounselor(request);
  if (error) return error;

  if (!process.env.SANITY_API_TOKEN) {
    console.error("SANITY_API_TOKEN is not set - cannot write to Sanity.");
    return NextResponse.json(
      { error: "Server isn't configured to save profile changes yet. Ask an admin to set SANITY_API_TOKEN." },
      { status: 500 }
    );
  }

  const { shiftStart, shiftEnd } = await request.json();

  if (!isValidHour(shiftStart) || !isValidHour(shiftEnd)) {
    return NextResponse.json({ error: "shiftStart and shiftEnd must both be whole hours from 0-23" }, { status: 400 });
  }
  if (shiftEnd <= shiftStart) {
    return NextResponse.json({ error: "Shift end must be after shift start" }, { status: 400 });
  }

  try {
    await sanityWriteClient
      .patch(counselor._id)
      .set({ shiftStart, shiftEnd })
      .commit();
  } catch (err: any) {
    console.error("Failed to update counselor working hours:", err);
    return NextResponse.json({ error: err?.message || "Failed to save working hours" }, { status: 500 });
  }

  return NextResponse.json({ success: true, shiftStart, shiftEnd });
}
