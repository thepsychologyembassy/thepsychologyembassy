import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Use Admin client to bypass RLS for server operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // PayU sends webhooks as Form Data, not JSON
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

    const {
      status, txnid, amount, productinfo, firstname, email, udf1, hash, key, additionalCharges
    } = data as Record<string, string>;

    if (!udf1) return NextResponse.json({ error: "No ID attached" }, { status: 400 });

    const salt = process.env.PAYU_MERCHANT_SALT;

    // PayU Reverse Hash Formula (Accounting for potential additional charges)
    const hashSequence = additionalCharges
      ? `${additionalCharges}|${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`
      : `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

    const calculatedHash = crypto.createHash("sha512").update(hashSequence).digest("hex");

// Authenticate the webhook request
    // Authenticate the webhook request
    if (calculatedHash === hash) {
      const isProgram = txnid.startsWith("TXN_PRG_");
      const targetTable = isProgram ? "program_applications" : "appointments";

      // 1. IDEMPOTENCY GUARD: Check the current database state first
      const { data: existingRecord } = await supabaseAdmin
        .from(targetTable)
        .select("status")
        .eq("id", udf1)
        .single();

      // If it's already marked as paid, ignore the duplicate webhook and return 200 OK
      if (existingRecord && existingRecord.status === "paid") {
        return NextResponse.json({ success: true, message: "Already processed" });
      }

      // 2. Process the state change
      if (status === "success") {
        await supabaseAdmin.from(targetTable).update({ status: "paid" }).eq("id", udf1);
      } else {
        // Only delete failed therapy appointments, leave failed program apps alone so they can retry
        if (!isProgram) {
          await supabaseAdmin.from("appointments").delete().eq("id", udf1);
        }
      }
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid Hash Signature" }, { status: 400 });
    }
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}