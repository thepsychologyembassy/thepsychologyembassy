import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  // Security Check: You can add a secret token here later to prevent hackers from triggering it
  
  try {
    // 1. Fetch all currently 'accepted' applications
    const { data: applications, error } = await supabase
      .from("program_applications")
      .select("*")
      .eq("status", "accepted");

    if (error || !applications) {
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }

    const now = new Date();
    let expiredCount = 0;

    // 2. Loop through them and check the timers
    for (const app of applications) {
      if (!app.accepted_at) continue;

      const acceptedDate = new Date(app.accepted_at);
      const diffMs = now.getTime() - acceptedDate.getTime();
      const hoursPassed = diffMs / (1000 * 60 * 60);

      // 3. If strictly over 24 hours...
      if (hoursPassed >= 24) {
        
        // A. Update Supabase to 'expired'
        await supabase
          .from("program_applications")
          .update({ status: "expired" })
          .eq("id", app.id);
        
        // B. Send Expiration Email to the Admin AND the Applicant
        // NOTE: While testing, change the 'to' address to YOUR verified Resend email!
        await resend.emails.send({
          from: "Project SARTHI <onboarding@resend.dev>",
          to: [app.applicant_email, "admin_test@yourdomain.com"], // <-- CHANGE THESE DURING TESTING
          subject: `Action Required: Application Expired - ${app.program_title}`,
          html: `
            <div style="font-family: sans-serif; color: #3A3A38; padding: 20px;">
              <h2 style="color: #A65D47;">Application Window Expired</h2>
              <p>Hello,</p>
              <p>The 24-hour payment window for <strong>${app.applicant_name}</strong> to join <strong>${app.program_title}</strong> has expired.</p>
              <p>Their seat has been automatically revoked to make room for the next person on the waitlist.</p>
              <p>If you believe this is an error, please log into the Admin Dashboard immediately.</p>
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