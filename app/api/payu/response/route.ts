import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendAppointmentConfirmationEmails } from "../../../../lib/email";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

    const {
      status, txnid, amount, productinfo, firstname, email, udf1, hash, key, additionalCharges
    } = data as Record<string, string>;

    const salt = process.env.PAYU_MERCHANT_SALT;
    const url = new URL(req.url);

    // Reverse Hash Calculation
    const hashSequence = additionalCharges
      ? `${additionalCharges}|${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`
      : `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

    const calcHash = crypto.createHash("sha512").update(hashSequence).digest("hex");

    // Verify hash to safely redirect the user
    if (calcHash === hash && status === "success") {
      // IDEMPOTENCY GUARD: the webhook fires independently and may have
      // already processed this payment (and sent the confirmation emails)
      // before this redirect handler runs. Check first so we never send
      // a duplicate email or re-process an already-paid appointment.
      const { data: existingRecord } = await supabaseAdmin
        .from("appointments")
        .select("*")
        .eq("id", udf1)
        .single();

      if (existingRecord && existingRecord.status !== "paid") {
        await supabaseAdmin.from("appointments").update({ 
          status: "paid",
          payment_order_id: txnid   // ADD THIS
        }).eq("id", udf1);

        await sendAppointmentConfirmationEmails(existingRecord as any);
      }

      return NextResponse.redirect(`${url.origin}/dashboard?payment=success`, 303);
    } 
    else {
      // CRITICAL FIX: Check if the webhook already marked it as paid before deleting
      const { data: existingApp } = await supabaseAdmin
        .from("appointments")
        .select("status")
        .eq("id", udf1)
        .single();

      // Only delete if the webhook hasn't already secured the payment
      if (existingApp && existingApp.status !== "paid") {
        await supabaseAdmin.from("appointments").delete().eq("id", udf1);
      }
      
      return NextResponse.redirect(`${url.origin}/book?payment=cancelled`, 303);
    }
  } catch (error) {
    console.error("Response Error:", error);
    const url = new URL(req.url);
    return NextResponse.redirect(`${url.origin}/book?payment=error`, 303);
  }
}