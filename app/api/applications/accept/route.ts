import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use the Service Role key to securely bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. SECURE JWT VERIFICATION (Replaces the exposed ADMIN_SECRET)
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session or token" }, { status: 401 });
    }

    const { appId } = await request.json();
    if (!appId) return NextResponse.json({ error: "Application ID required" }, { status: 400 });

    // 2. SECURE DATABASE WRITE
    const { data: app, error } = await supabaseAdmin
      .from("program_applications")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", appId)
      .select().single();

    if (error || !app) return NextResponse.json({ error: "Failed to update" }, { status: 500 });

    // 3. SEND EMAIL NOTIFICATION
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "https://psychologyembassy.com";
    const paymentLink = `${baseUrl}/pay/${app.id}`;

    await resend.emails.send({
      from: "Project SARTHI <contact@psychologyembassy.com>",
      to: [app.applicant_email],
      subject: `Action Required: You have been accepted to ${app.program_title}!`,
      html: `
        <div style="font-family: sans-serif; color: #3A3A38; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #FBF8F2; border-radius: 12px;">
          <h2 style="color: #2C4C5B; margin-bottom: 20px;">Congratulations, ${app.applicant_name}!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Your application for <strong>${app.program_title}</strong> has been carefully reviewed and accepted.</p>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #A65D47; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #A65D47; text-transform: uppercase;">Time-Sensitive</p>
            <p style="margin: 8px 0 0 0; font-size: 15px;">You have exactly <strong>24 hours</strong> to secure your seat before it passes to the waitlist.</p>
          </div>
          <a href="${paymentLink}" style="display: inline-block; background-color: #2C4C5B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Secure Your Seat Now</a>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Applicant accepted and emailed." });
  } catch (error) {
    console.error("Accept Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}