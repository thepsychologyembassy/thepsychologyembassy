import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { appointmentId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

    if (!appointmentId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required payment details" }, { status: 400 });
    }

    // 1. VERIFY RAZORPAY SIGNATURE (Security Fix)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 2. Generate secure room link
    const secureRoomId = `Sarthi-Session-${appointmentId.split("-")[0]}-${Date.now()}`;
    const meetingLink = `https://meet.jit.si/${secureRoomId}`;

    // 3. Update Supabase
    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({ 
        status: "paid",
        payment_order_id: razorpay_payment_id,
        meeting_link: meetingLink
      })
      .eq("id", appointmentId)
      .select().single();

    if (error || !appointment) return NextResponse.json({ error: "Failed to confirm" }, { status: 500 });

    // 4. Send Email to Actual Patient
    await resend.emails.send({
      from: "Project SARTHI <onboarding@resend.dev>",
      to: [appointment.patient_email], // LIVE TARGET
      subject: `Booking Confirmed: Session with ${appointment.counselor_name}`,
      html: `
        <div style="font-family: sans-serif; color: #3A3A38; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #FBF8F2; border-radius: 12px;">
          <h2 style="color: #2C4C5B; margin-bottom: 20px;">Your Session is Confirmed!</h2>
          <p style="font-size: 16px;">Hello ${appointment.patient_name},</p>
          <p style="font-size: 16px;">Your payment of ₹${appointment.total_price} was successful.</p>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #88B7B5; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #4F6F52; text-transform: uppercase;">Session Details</p>
            <p style="margin: 4px 0;"><strong>Counselor:</strong> ${appointment.counselor_name}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${appointment.appointment_date}</p>
          </div>
          ${appointment.modality === 'online' ? `
          <div style="margin: 32px 0;">
            <p style="font-size: 14px; color: #A65D47; font-weight: bold; margin-bottom: 12px;">Your Secure Meeting Link:</p>
            <a href="${meetingLink}" style="display: inline-block; background-color: #2C4C5B; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: bold;">
              Join Video Session
            </a>
          </div>` : `<p>Please arrive at our clinic 10 minutes early.</p>`}
        </div>
      `,
    });

    return NextResponse.json({ success: true, meeting_link: meetingLink });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}