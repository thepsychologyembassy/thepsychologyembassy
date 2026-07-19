import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AppointmentRow {
  id: string;
  patient_name: string;
  patient_email: string;
  counselor_id: string;
  counselor_name: string;
  counselor_email: string;
  appointment_date: string;
  time_slots: number[];
  modality: string;
  status: string;
  meeting_link: string | null;
  reminder_sent: boolean | null;
}

function formatTime(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
}

export async function GET(request: Request) {
  // 1. Authorization
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const expectedSecret = process.env.CRON_SECRET || "";

  if (token.length !== expectedSecret.length) {
    return new Response("Unauthorized", { status: 401 });
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedSecret)
  );

  if (!isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 2. Force current server time to IST (Asia/Kolkata)
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const currentHourIST = nowIST.getHours();
    
    // Format IST date to YYYY-MM-DD
    const year = nowIST.getFullYear();
    const month = String(nowIST.getMonth() + 1).padStart(2, '0');
    const day = String(nowIST.getDate()).padStart(2, '0');
    const todayIST = `${year}-${month}-${day}`;

    // 3. Fetch today's paid appointments that haven't had a reminder sent
    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("status", "paid")
      .eq("appointment_date", todayIST)
      .or("reminder_sent.is.null,reminder_sent.eq.false");

    if (error) {
      console.error("Session reminder fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
    }

    let sentCount = 0;
    const debugLog: string[] = [];

    // 4. Evaluate and Send
    for (const apt of (appointments || []) as AppointmentRow[]) {
      if (!apt.time_slots || apt.time_slots.length === 0) continue;

      const startHour = Math.min(...apt.time_slots);

      // If current time is 4:XX PM (16), send reminders for 5:00 PM (17)
      if (startHour === currentHourIST + 1) {
        
        const dateStr = nowIST.toLocaleDateString("en-IN", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        });
        
        const endHour = Math.max(...apt.time_slots) + 1;
        const timeStr = `${formatTime(startHour)} - ${formatTime(endHour)}`;
        const isOnline = apt.modality === "online";

        // Patient Email
        if (apt.patient_email) {
          await resend.emails.send({
            from: "The Psychology Embassy <bookings@contact.psychologyembassy.com>",
            to: [apt.patient_email],
            subject: `Your session starts in 1 hour`,
            html: `
              <div style="font-family: sans-serif; color: #3A3A38; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F6F52;">Your Session Starts Soon</h2>
                <p>Hello ${apt.patient_name},</p>
                <p>Your session with <strong>${apt.counselor_name}</strong> starts at <strong>${timeStr}</strong> on ${dateStr}.</p>
                ${
                  isOnline
                    ? apt.meeting_link
                      ? `<p><a href="${apt.meeting_link}" style="background-color: #4F6F52; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Join Video Session</a></p>`
                      : `<p>Your join link is available now on your <a href="https://thepsychologyembassy.com/dashboard">Dashboard</a>.</p>`
                    : `<p>This is an in-person session. Please check your <a href="https://thepsychologyembassy.com/dashboard">Dashboard</a> for the address.</p>`
                }
              </div>
            `,
          });
        }

        // Counselor Email
        if (apt.counselor_email) {
          await resend.emails.send({
            from: "The Psychology Embassy <bookings@contact.psychologyembassy.com>",
            to: [apt.counselor_email],
            subject: `Session with ${apt.patient_name} starts in 1 hour`,
            html: `
              <div style="font-family: sans-serif; color: #3A3A38; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2C4C5B;">Upcoming Session</h2>
                <p>Hello ${apt.counselor_name},</p>
                <p>Your session with <strong>${apt.patient_name}</strong> starts at <strong>${timeStr}</strong> on ${dateStr}.</p>
                ${
                  isOnline && apt.meeting_link
                    ? `<p><a href="${apt.meeting_link}" style="background-color: #2C4C5B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Join Video Session</a></p>`
                    : `<p>Check your Counselor Portal for full details.</p>`
                }
              </div>
            `,
          });
        }

        // Lock the row so it doesn't send again
        await supabaseAdmin
          .from("appointments")
          .update({ reminder_sent: true })
          .eq("id", apt.id);

        sentCount++;
        debugLog.push(`Sent reminder for Apt ID: ${apt.id}`);
      } else {
        debugLog.push(`Skipped Apt ID: ${apt.id}. Starts at ${startHour}:00, Server IST is ${currentHourIST}:XX.`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${appointments?.length || 0} appointments today. Sent ${sentCount} reminders.`,
      debug: debugLog
    });

  } catch (error) {
    console.error("Session reminder cron error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}