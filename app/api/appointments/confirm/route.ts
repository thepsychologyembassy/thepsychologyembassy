import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { appointmentId, paymentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });
    }

    // 1. Generate a unique, secure video room link
    const secureRoomId = `Sarthi-Session-${appointmentId.split("-")[0]}-${Date.now()}`;
    const meetingLink = `https://meet.jit.si/${secureRoomId}`;

    // 2. Update the appointment in Supabase
    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({ 
        status: "paid",
        payment_order_id: paymentId,
        meeting_link: meetingLink
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: "Failed to confirm appointment" }, { status: 500 });
    }

    // 3. Send the Confirmation Email via Resend
    // NOTE: Change the 'to' address to YOUR email for testing!
    await resend.emails.send({
      from: "Project SARTHI <onboarding@resend.dev>",
      to: ["your_actual_email@gmail.com"], // <-- CHANGE THIS TO YOUR REAL EMAIL FOR TESTING
      subject: `Booking Confirmed: Session with ${appointment.counselor_name}`,
      html: `
        <div style="font-family: sans-serif; color: #3A3A38; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #FBF8F2; border-radius: 12px;">
          <h2 style="color: #2C4C5B; margin-bottom: 20px;">Your Session is Confirmed!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Hello ${appointment.patient_name},</p>
          <p style="font-size: 16px; line-height: 1.5;">Your payment of ₹${appointment.total_price} was successful. Your counseling session has been secured.</p>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #88B7B5; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #4F6F52; text-transform: uppercase; letter-spacing: 1px;">Session Details</p>
            <p style="margin: 4px 0;"><strong>Counselor:</strong> ${appointment.counselor_name}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${appointment.appointment_date}</p>
            <p style="margin: 4px 0;"><strong>Format:</strong> ${appointment.modality === 'online' ? 'Online Video Call' : 'In-Person Clinic'}</p>
          </div>

          ${appointment.modality === 'online' ? `
          <div style="margin: 32px 0;">
            <p style="font-size: 14px; color: #A65D47; font-weight: bold; margin-bottom: 12px;">Your Secure Meeting Link:</p>
            <a href="${meetingLink}" style="display: inline-block; background-color: #2C4C5B; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: bold;">
              Join Video Session
            </a>
            <p style="font-size: 12px; color: #666; margin-top: 12px;">(This link will also be available in your Dashboard)</p>
          </div>
          ` : `
          <div style="margin: 32px 0;">
            <p style="font-size: 14px; color: #A65D47; font-weight: bold; margin-bottom: 12px;">In-Person Session:</p>
            <p style="font-size: 14px;">Please arrive at our clinic 10 minutes prior to your scheduled time.</p>
          </div>
          `}

          <p style="font-size: 14px; color: #666; margin-top: 32px;">Warmly,<br>The Project SARTHI Team</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, meeting_link: meetingLink });

  } catch (error) {
    console.error("Confirmation API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}