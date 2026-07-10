import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../../lib/sanity";

// Secure server-side client bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, firstname, email, productinfo } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "No application ID provided" }, { status: 400 });
    }

    // 1. Verify application exists and is strictly 'accepted'
    const { data: app, error: appError } = await supabaseAdmin
      .from("program_applications")
      .select("program_id, status")
      .eq("id", applicationId)
      .single();

    if (appError || !app || app.status !== "accepted") {
      return NextResponse.json({ error: "Invalid or expired application state" }, { status: 400 });
    }

    // 2. Fetch the true price securely from Sanity
    const program = await client.fetch(
      `*[_id == $id][0]{ price }`,
      { id: app.program_id },
      { cache: 'no-store' }
    );

    if (!program || !program.price) {
      return NextResponse.json({ error: "Program price data not found" }, { status: 400 });
    }

    const key = process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    const txnid = "TXN_PRG_" + Date.now() + Math.floor(Math.random() * 1000);
    const secureAmount = program.price;

    // 3. Generate strict PayU hash string including the applicationId in udf1
    const hashString = `${key}|${txnid}|${secureAmount}|${productinfo}|${firstname}|${email}|${applicationId}||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    return NextResponse.json({ hash, txnid, key, amount: secureAmount });
  } catch (error) {
    console.error("Program hash generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}