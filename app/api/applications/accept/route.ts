import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { appId } = await request.json();

    if (!appId) return NextResponse.json({ error: "Application ID required" }, { status: 400 });

    const { data: app, error } = await supabase
      .from("program_applications")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", appId)
      .select().single();

    if (error || !app) return NextResponse.json({ error: "Failed to update" }, { status: 500 });

    // DYNAMIC URL (Fixes localhost issue)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "https://psychologyembassy.com";
    const paymentLink = `${baseUrl}/pay/${app.id}`;

    await resend.emails.send({
      from: "Project SARTHI <onboarding@resend.dev>", 
      to: [app.applicant_email], // LIVE TARGET
      subject: `Action Required: You have been accepted to ${app.program_title}!`,
      html: `
        <div style="font-family: sans-serif; color: #3A3A38; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #FBF8F2; border-radius: 12px;">
          <h2 style="color: #2C4C5B; margin-bottom: 20px;">Congratulations, ${app.applicant_name}!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Your application for <strong>${app.program_title}</strong> has been carefully reviewed and accepted.</p>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #A65D47; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #A65D47; text-transform: uppercase;">Time-Sensitive</p>
            <p style="margin: 8px 0 0 0; font-size: 15px;">You have exactly <strong>24 hours</strong> to secure your seat before it passes to the waitlist.</p>
          </div>
          <a href="${paymentLink}" style="display: inline-block; background-color: #2C4C5B; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: bold; margin-bottom: 24px;">
            Secure My Seat & Pay Now
          </a>
        </div>
      `,
    });

    return NextResponse.json({ success: true, application: app });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}