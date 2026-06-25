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

  // Send Confirmation Email
  try {
    await resend.emails.send({
      from: "Project SARTHI <contact@psychologyembassy.com>",
      to: [app.applicant_email],
      subject: `Seat Confirmed: ${app.program_title}`,
      html: `
        <div style="font-family: sans-serif; color: #3A3A38; padding: 20px;">
          <h2 style="color: #4F6F52;">Payment Successful!</h2>
          <p>Hello ${app.applicant_name},</p>
          <p>Your payment for <strong>${app.program_title}</strong> was successfully processed. Your seat is officially secured.</p>
          <p>We are thrilled to have you join us and will be in touch shortly with the next steps.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send confirmation email:", emailError);
    // We don't return an error here so the user still sees a success screen even if the email fails
  }

  return NextResponse.json({ success: true });
}