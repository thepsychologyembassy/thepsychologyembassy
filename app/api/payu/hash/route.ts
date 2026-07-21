import { NextResponse } from "next/server";
import crypto from "crypto";
import { client } from "../../../../lib/sanity";
import { createClient } from "@supabase/supabase-js";
import { validateCoupon } from "../../../../lib/coupons";

// Initialize Admin client to safely check DB state
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstname, email, productinfo, counselor_id, slots_count, appointment_id, coupon_code } = body;

    if (!counselor_id || !slots_count || !appointment_id) {
      return NextResponse.json({ error: "Missing booking identifiers" }, { status: 400 });
    }

    // CRITICAL FIX: Ensure appointment exists and is strictly "pending"
    const { data: appointment } = await supabaseAdmin
      .from("appointments")
      .select("status, patient_email")
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

    let secureAmount = counselor.fees * slots_count;
    let appliedCouponCode: string | null = null;
    let discountAmount = 0;

    // Re-validate the coupon server-side - never trust a discount value
    // sent from the client. If it's invalid at this point (expired,
    // already used, etc. - even if it looked fine moments ago) we reject
    // the whole checkout rather than silently charging full price, so the
    // user isn't surprised at the PayU screen.
    if (coupon_code) {
      const result = await validateCoupon(coupon_code, appointment.patient_email);
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      discountAmount = Math.round(secureAmount * (result.coupon.discount_percent / 100) * 100) / 100;
      secureAmount = Math.round((secureAmount - discountAmount) * 100) / 100;
      appliedCouponCode = result.coupon.code;
    }

    // Persist which coupon (if any) applies to this appointment now, so the
    // PayU response/webhook handlers can record the redemption once payment
    // actually succeeds (and so a retried payment can't apply a coupon twice).
    await supabaseAdmin
      .from("appointments")
      .update({ coupon_code: appliedCouponCode, discount_amount: discountAmount })
      .eq("id", appointment_id);

    const key = process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    const txnid = "TXN_" + Date.now() + Math.floor(Math.random() * 1000);

    const hashString = `${key}|${txnid}|${secureAmount}|${productinfo}|${firstname}|${email}|${appointment_id}||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    return NextResponse.json({
      hash,
      txnid,
      key,
      amount: secureAmount,
      discountAmount,
      couponApplied: appliedCouponCode,
    });
  } catch (error) {
    console.error("Hash generation error:", error);
    return NextResponse.json({ error: "Hash generation failed" }, { status: 500 });
  }
}
