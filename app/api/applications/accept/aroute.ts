import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { appId } = await request.json();

    if (!appId) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
    }

    // 1. Update the application in Supabase and fetch the updated row
    const { data: app, error } = await supabase
      .from("program_applications")
      .update({ 
        status: "accepted", 
        accepted_at: new Date().toISOString() 
      })
      .eq("id", appId)
      .select()
      .single();

    if (error || !app) {
      return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
    }

    // 2. Generate the secure payment link
    // Change this to your live domain (e.g., https://sarthi.com/pay/...) before launch!
    const paymentLink = `http://localhost:3000/pay/${app.id}`;

    // 3. Send the Acceptance Email via Resend
    // NOTE: During testing, change the 'to' address to YOUR verified Resend email!
    await resend.emails.send({
      from: "Project SARTHI <onboarding@resend.dev>", 
      to: [app.applicant_email], // CHANGE THIS TO YOUR EMAIL FOR TESTING
      subject: `Action Required: You have been accepted to ${app.program_title}!`,
      html: `
        <div style="font-family: sans-serif; color: #3A3A38; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #FBF8F2; border-radius: 12px;">
          <h2 style="color: #2C4C5B; margin-bottom: 20px;">Congratulations, ${app.applicant_name}!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Your application for <strong>${app.program_title}</strong> has been carefully reviewed and accepted by our team.</p>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #A65D47; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #A65D47; text-transform: uppercase; letter-spacing: 1px;">Time-Sensitive</p>
            <p style="margin: 8px 0 0 0; font-size: 15px;">You have exactly <strong>24 hours</strong> to secure your seat. If payment is not received, your seat will automatically be passed to the next person on the waitlist.</p>
          </div>

          <a href="${paymentLink}" style="display: inline-block; background-color: #2C4C5B; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: bold; margin-bottom: 24px;">
            Secure My Seat & Pay Now
          </a>

          <p style="font-size: 14px; color: #666;">If you have any questions, simply reply to this email.</p>
          <p style="font-size: 14px; color: #666;">Warmly,<br>The Project SARTHI Team</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, application: app });

  } catch (error) {
    console.error("Acceptance API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}