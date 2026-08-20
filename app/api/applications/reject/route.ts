import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { client } from "../../../../lib/sanity";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. SECURE JWT VERIFICATION
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Invalid session or token" }, { status: 401 });
    }

    // 2. VERIFY ADMIN ROLE VIA SANITY (same allowlist used everywhere else)
    const settings = await client.fetch(`*[_type == "siteSettings" && _id == "siteSettings"][0]{ adminEmails }`);
    const adminEmails = settings?.adminEmails || [];

    if (!adminEmails.includes(user.email)) {
      console.warn(`SECURITY ALERT: Non-admin ${user.email} attempted to reject an application.`);
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { appId } = await request.json();
    if (!appId) return NextResponse.json({ error: "Application ID required" }, { status: 400 });

    // 3. SECURE DATABASE WRITE
    const { data: app, error } = await supabaseAdmin
      .from("program_applications")
      .update({ status: "rejected" })
      .eq("id", appId)
      .select().single();

    if (error || !app) return NextResponse.json({ error: "Failed to reject application" }, { status: 500 });

    // 4. AUDIT LOGGING
    await supabaseAdmin.from("admin_logs").insert([{
      admin_email: user.email,
      action: "rejected_application",
      target_id: appId,
      details: `Rejected applicant ${app.applicant_email} for ${app.program_title}`
    }]);

    // 5. NOTIFY THE APPLICANT (best-effort — a failed email shouldn't block the rejection)
    try {
      await resend.emails.send({
        from: "The Psychology Embassy <contact@psychologyembassy.com>",
        to: [app.applicant_email],
        subject: `Update on your application to ${app.program_title}`,
        html: `
          <div style="font-family: sans-serif; color: #3A3A38; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #FBF8F2; border-radius: 12px;">
            <h2 style="color: #2C4C5B; margin-bottom: 20px;">Thank you for applying, ${app.applicant_name}</h2>
            <p style="font-size: 15px; line-height: 1.6;">We appreciate the time you took to apply for <strong>${app.program_title}</strong>. After careful review, we're unable to offer you a place this time.</p>
            <p style="font-size: 15px; line-height: 1.6;">We'd encourage you to apply again for future cohorts — we hope to hear from you soon.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Non-fatal: Failed to send rejection email:", emailError);
    }

    return NextResponse.json({ success: true, message: "Application rejected and applicant notified." });
  } catch (error) {
    console.error("Reject Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
