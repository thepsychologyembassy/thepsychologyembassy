import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  // 1. SECURITY LOCK: Verify the Cron Secret
  // This ensures random bots cannot trigger your application expirations.
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  try {
    const { data: applications, error } = await supabase
      .from("program_applications")
      .select("*")
      .eq("status", "accepted");

    if (error || !applications) {
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }

    const now = new Date();
    let expiredCount = 0;

    for (const app of applications) {
      if (!app.accepted_at) continue;

      const acceptedDate = new Date(app.accepted_at);
      const diffMs = now.getTime() - acceptedDate.getTime();
      const hoursPassed = diffMs / (1000 * 60 * 60);

      if (hoursPassed >= 24) {
        
        await supabase
          .from("program_applications")
          .update({ status: "expired" })
          .eq("id", app.id);
        
        // Expiration Email to Applicant
        await resend.emails.send({
          from: "Project SARTHI <contact.psychologyembassy.com>",
          to: [app.applicant_email], // Removed hardcoded admin email, sends to actual student
          subject: `Application Expired - ${app.program_title}`,
          html: `
            <div style="font-family: sans-serif; color: #3A3A38; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #A65D47;">Application Window Expired</h2>
              <p>Hello ${app.applicant_name},</p>
              <p>Your 24-hour window to secure your seat for <strong>${app.program_title}</strong> has expired.</p>
              <p>Your seat has been passed to the next person on the waitlist. If you believe this is an error, please contact us immediately.</p>
            </div>
          `,
        });

        expiredCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Checked ${applications.length} applications. Expired ${expiredCount} seats.` 
    });

  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}