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
  appointment_date: string; // e.g. "2026-07-19"
  time_slots: number[]; // hour numbers, e.g. [14] for 2pm
  modality: string;
  status: string;
  meeting_link: string | null;
  reminder_sent: boolean | null;
}

function sessionStart(appointment_date: string, time_slots: number[]) {
  const startHour = Math.min(...time_slots);
  // appointment_date is a plain date (no time); attach the start hour in local server time.
  const d = new Date(appointment_date);
  d.setHours(startHour, 0, 0, 0);
  return d;
}

function formatTime(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
}

export async function GET(request: Request) {
  // Same auth pattern as the existing /api/cron route.
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
    // Only need to look at sessions happening today, that are paid, and
    // haven't had a reminder sent yet. We narrow the exact 30-minute
    // window in code below since time_slots is an hour array, not a
    // timestamp column.
    const todayStr = new Date().toISOString().slice(0, 10);

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("status", "paid")
      .eq("appointment_date", todayStr)
      .or("reminder_sent.is.null,reminder_sent.eq.false");

    if (error) {
      console.error("Session reminder fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
    }

    const now = new Date();
    let sentCount = 0;

    for (const apt of (appointments || []) as AppointmentRow[]) {
      if (!apt.time_slots || apt.time_slots.length === 0) continue;

      const start = sessionStart(apt.appointment_date, apt.time_slots);
      const minutesUntilStart = (start.getTime() - now.getTime()) / (1000 * 60);

      // Fire once the session is between 20 and 40 minutes away. GitHub
      // Actions' scheduled runs are "best effort" and can lag by several
      // minutes (more under load), so this window is intentionally wider
      // than the 10-minute trigger interval to make sure a run always
      // lands inside it. reminder_sent still guards against duplicates
      // if two runs both land in the window.
      if (minutesUntilStart > 40 || minutesUntilStart < 20) continue;

      const dateStr = start.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const startHour = Math.min(...apt.time_slots);
      const endHour = Math.max(...apt.time_slots) + 1;
      const timeStr = `${formatTime(startHour)} - ${formatTime(endHour)}`;
      const isOnline = apt.modality === "online";

      // ── Patient reminder — this is the one email that's allowed to
      // carry the real link, since we're now inside the 30-minute window.
      if (apt.patient_email) {
        await resend.emails.send({
          from: "Psychology Embassy <bookings@contact.psychologyembassy.com>",
          to: [apt.patient_email],
          subject: `Your session starts in 30 minutes`,
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

      // ── Counselor reminder (optional but keeps them in the loop too).
      if (apt.counselor_email) {
        await resend.emails.send({
          from: "Psychology Embassy <bookings@contact.psychologyembassy.com>",
          to: [apt.counselor_email],
          subject: `Session with ${apt.patient_name} starts in 30 minutes`,
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

      await supabaseAdmin
        .from("appointments")
        .update({ reminder_sent: true })
        .eq("id", apt.id);

      sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${appointments?.length || 0} appointments today. Sent ${sentCount} reminders.`,
    });
  } catch (error) {
    console.error("Session reminder cron error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}