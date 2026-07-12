import { NextResponse } from "next/server";
import crypto from "crypto";
import { client } from "../../../../lib/sanity";
import { createClient } from "@supabase/supabase-js";

// Initialize Admin client to safely check DB state
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstname, email, productinfo, counselor_id, slots_count, appointment_id } = body;

    if (!counselor_id || !slots_count || !appointment_id) {
      return NextResponse.json({ error: "Missing booking identifiers" }, { status: 400 });
    }

    // CRITICAL FIX: Ensure appointment exists and is strictly "pending"
    const { data: appointment } = await supabaseAdmin
      .from("appointments")
      .select("status")
      .eq("id", appointment_id)
      .single();

    if (!appointment || appointment.status !== "pending") {
      return NextResponse.json({ error: "Invalid appointment state. It may already be paid or cancelled." }, { status: 400 });
    }

    const counselor = await client.fetch(
      `*[_type == "counselor" && _id == $id][0]`, 
      { id: counselor_id },
      { cache: 'no-store' }
    );
    
    if (!counselor || !counselor.fees) {
      return NextResponse.json({ error: "Invalid counselor data" }, { status: 400 });
    }

    const secureAmount = counselor.fees * slots_count;
    const key = process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    const txnid = "TXN_" + Date.now() + Math.floor(Math.random() * 1000);

    const hashString = `${key}|${txnid}|${secureAmount}|${productinfo}|${firstname}|${email}|${appointment_id}||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    return NextResponse.json({ hash, txnid, key, amount: secureAmount });
  } catch (error) {
    console.error("Hash generation error:", error);
    return NextResponse.json({ error: "Hash generation failed" }, { status: 500 });
  }
}