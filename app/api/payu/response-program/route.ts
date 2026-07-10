import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    const {
      status, txnid, amount, productinfo, firstname, email, udf1, hash, key, additionalCharges
    } = data as Record<string, string>;

    const salt = process.env.PAYU_MERCHANT_SALT;
    const url = new URL(request.url);

    // 1. Recalculate the reverse hash to authenticate PayU data
    const hashSequence = additionalCharges
      ? `${additionalCharges}|${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`
      : `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

    const calculatedHash = crypto.createHash("sha512").update(hashSequence).digest("hex");

    // 2. Validate hash integrity and status
    if (calculatedHash === hash && status === "success") {
      // Safely update application record to paid status
      await supabaseAdmin
        .from("program_applications")
        .update({ status: "paid" })
        .eq("id", udf1);

      // Redirect client back to the application payment route where success UI displays
      return NextResponse.redirect(`${url.origin}/pay/${udf1}`, 303);
    } else {
      // If validation fails or transaction was dropped, redirect back to clear processing states
      return NextResponse.redirect(`${url.origin}/pay/${udf1}?error=payment_failed`, 303);
    }
  } catch (error) {
    console.error("Program payment response parsing error:", error);
    const url = new URL(request.url);
    return NextResponse.redirect(`${url.origin}/courses`, 303);
  }
}