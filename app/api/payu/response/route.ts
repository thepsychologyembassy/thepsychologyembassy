import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const status = formData.get("status") as string;
    const txnid = formData.get("txnid") as string;
    const amount = formData.get("amount") as string;
    const productinfo = formData.get("productinfo") as string;
    const firstname = formData.get("firstname") as string;
    const email = formData.get("email") as string;
    const hash = formData.get("hash") as string;

    const url = new URL(request.url);
    const appointmentId = url.searchParams.get("appointment_id");

    const salt = process.env.PAYU_MERCHANT_SALT;
    const key = process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY;

    // Verify PayU Reverse Hash for Security
    const reverseHashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const calcHash = crypto.createHash("sha512").update(reverseHashString).digest("hex");

    if (calcHash === hash && status === "success") {
      // Payment verified & successful
      await supabase.from("appointments").update({ status: "paid" }).eq("id", appointmentId);
      return NextResponse.redirect(`${url.origin}/dashboard?payment=success`, 303);
    } else {
      // Payment failed, canceled by user, or hash mismatch -> DELETE the ghost appointment
      await supabase.from("appointments").delete().eq("id", appointmentId);
      return NextResponse.redirect(`${url.origin}/book?payment=cancelled`, 303);
    }
  } catch (err) {
    console.error("PayU Webhook Error:", err);
    const url = new URL(request.url);
    return NextResponse.redirect(`${url.origin}/book?payment=error`, 303);
  }
}