import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { appId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

  if (!appId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // 1. VERIFY SIGNATURE — same as appointments/confirm
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expected !== razorpay_signature)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  // 2. Update DB only after signature passes
  const { data: app, error } = await supabase
    .from("program_applications")
    .update({ status: "paid", payment_order_id: razorpay_payment_id })
    .eq("id", appId)
    .eq("status", "accepted") // only update if genuinely accepted
    .select().single();

  if (error || !app)
    return NextResponse.json({ error: "Failed to confirm" }, { status: 500 });

  return NextResponse.json({ success: true });
}