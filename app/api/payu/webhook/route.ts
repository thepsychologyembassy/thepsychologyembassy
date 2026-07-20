import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendAppointmentConfirmationEmails } from "../../../../lib/email";

// Secure server-side Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    const { status, txnid, hash, udf1, amount, firstname, email, productinfo } = data;

    // 1. Verify PayU Hash to ensure security
    const salt = process.env.PAYU_MERCHANT_SALT!;
    const hashString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY}`;
    const calcHash = crypto.createHash("sha512").update(hashString).digest("hex");

    if (calcHash !== hash) {
      return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
    }

    const targetTable = txnid.toString().startsWith("PG_") ? "program_applications" : "appointments";

    if (status === "success") {
      // IDEMPOTENCY GUARD: check the status BEFORE we touch it. This tells us
      // whether THIS call is the one actually paying the appointment, or
      // whether it's a duplicate webhook retry / the response-route redirect
      // already having handled it. (Checking status AFTER the update below
      // would always read back "paid" and incorrectly skip emails every time.)
      const { data: preUpdateAppointment } =
        targetTable === "appointments"
          ? await supabaseAdmin.from("appointments").select("*").eq("id", udf1).single()
          : { data: null };

      const alreadyPaid = preUpdateAppointment?.status === "paid";

      // 2. Update Database: Mark as paid and save Transaction ID
      await supabaseAdmin
        .from(targetTable)
        .update({ status: "paid", payment_order_id: txnid })
        .eq("id", udf1);

      // 3. SEND EMAILS IF IT IS AN APPOINTMENT AND WE'RE THE ONE PAYING IT
      if (targetTable === "appointments" && preUpdateAppointment && !alreadyPaid) {
        await sendAppointmentConfirmationEmails(preUpdateAppointment as any);

        // Close the loop on the intake session this booking came from, if any.
        if (preUpdateAppointment.intake_session_id) {
          await supabaseAdmin
            .from("intake_sessions")
            .update({ status: "converted", updated_at: new Date().toISOString() })
            .eq("id", preUpdateAppointment.intake_session_id);
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}