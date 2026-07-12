import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { client } from "../../../../lib/sanity";

// Secure server-side client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. SECURE JWT VERIFICATION
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Invalid session or token" }, { status: 401 });
    }

    const { appointmentId } = await request.json();
    if (!appointmentId) return NextResponse.json({ error: "Appointment ID required" }, { status: 400 });

    // 2. FETCH APPOINTMENT DATA (Now including appointment_date)
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from("appointments")
      .select("patient_email, status, payment_order_id, counselor_id, time_slots, appointment_date")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Ensure the person cancelling is actually the patient who booked it
    if (appointment.patient_email !== user.email) {
      return NextResponse.json({ error: "Forbidden: You do not own this appointment" }, { status: 403 });
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json({ error: "Appointment is already cancelled" }, { status: 400 });
    }

    // 2.5 ENFORCE 30-MINUTE CANCELLATION CUTOFF
    if (appointment.time_slots && appointment.time_slots.length > 0 && appointment.appointment_date) {
      const startHour = Math.min(...appointment.time_slots);
      const appointmentStart = new Date(appointment.appointment_date);
      appointmentStart.setHours(startHour, 0, 0, 0);

      const minutesUntilStart = (appointmentStart.getTime() - Date.now()) / (1000 * 60);

      if (minutesUntilStart < 30) {
        return NextResponse.json(
          { error: "Cancellations are not allowed within 30 minutes of your appointment start time." },
          { status: 400 }
        );
      }
    }

    // 3. INITIATE PAYU REFUND WITH MATHEMATICALLY VERIFIED PRICING
    if (appointment.status === "paid" && appointment.payment_order_id) {
      
      // Fetch the true price securely from Sanity
      const counselor = await client.fetch(
        `*[_type == "counselor" && _id == $id][0]{ fees }`,
        { id: appointment.counselor_id },
        { cache: 'no-store' }
      );

      if (!counselor || !counselor.fees || !appointment.time_slots) {
        return NextResponse.json({ error: "Could not securely verify refund amount" }, { status: 500 });
      }

      // Calculate the true, server-verified amount
      const secureRefundAmount = counselor.fees * appointment.time_slots.length;

      const key = process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY!;
      const salt = process.env.PAYU_MERCHANT_SALT!;
      const command = "cancel_refund_transaction";
      const txnid = appointment.payment_order_id; 

      // PayU Refund Hash Formula: key|command|var1|salt
      const hashString = `${key}|${command}|${txnid}|${salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      const payuFormData = new URLSearchParams();
      payuFormData.append("key", key);
      payuFormData.append("command", command);
      payuFormData.append("var1", txnid); // The original transaction ID
      payuFormData.append("var2", secureRefundAmount.toString()); // SECURE Refund Amount
      payuFormData.append("var3", appointmentId); // Optional: Refund ID/Reference
      payuFormData.append("hash", hash);

      const refundRes = await fetch("https://info.payu.in/merchant/postservice.php?form=2", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payuFormData.toString(),
      });

      const refundData = await refundRes.json();
      
      // PayU returns status 1 for success
      if (refundData.status !== 1) {
        console.error("PayU Refund Failed:", refundData.msg);
        return NextResponse.json({ error: "Failed to process refund with bank. Please contact support." }, { status: 500 });
      }
    }

    // 4. UPDATE DATABASE TO FREE UP THE SLOT
    const { error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: "Appointment cancelled and refunded successfully." });
  } catch (error) {
    console.error("Cancellation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}