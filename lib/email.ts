import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { client as sanityClient } from "./sanity";

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
}

function formatSessionTime(appointment_date: string, time_slots: number[]) {
  const sorted = [...time_slots].sort((a, b) => a - b);
  const startHour = sorted[0];
  const endHour = sorted[sorted.length - 1] + 1;

  const dateObj = new Date(appointment_date);
  const dateStr = dateObj.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const to12h = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:00 ${period}`;
  };

  return { dateStr, timeStr: `${to12h(startHour)} - ${to12h(endHour)}` };
}

/**
 * Called right after an appointment is marked "paid".
 * - Looks up the counselor's permanent meeting link / clinic address in Sanity
 * - Saves the meeting link onto the appointment row (only for online sessions)
 * - Emails the patient (no raw link — it unlocks in their dashboard 30 min prior)
 * - Emails the counselor (full details + the link, no gating needed for them)
 *
 * Safe to call multiple times for the same appointment_id — idempotency is
 * enforced by the caller (webhook/response routes only call this once,
 * guarded by a "was this already paid?" check before the status update).
 */
export async function sendAppointmentConfirmationEmails(appointment: AppointmentRow) {
  try {
    const counselor = await sanityClient.fetch(
      `*[_id == $id][0]{ meetingLink, clinicAddress }`,
      { id: appointment.counselor_id }
    );

    const isOnline = appointment.modality === "online";
    const meetingLink = isOnline ? counselor?.meetingLink : null;

    if (meetingLink) {
      await supabaseAdmin
        .from("appointments")
        .update({ meeting_link: meetingLink })
        .eq("id", appointment.id);
    }

    const { dateStr, timeStr } = formatSessionTime(
      appointment.appointment_date,
      appointment.time_slots
    );

    // ── Patient email — deliberately does NOT include the raw link.
    // The link only becomes clickable in their dashboard 30 minutes
    // before the session; putting it in the email would let them (or
    // anyone forwarded the email) bypass that window entirely.
    const patientHtml = `
      <div style="font-family: sans-serif; color: #3A3A38; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F6F52;">Your Session is Confirmed</h2>
        <p>Hello ${appointment.patient_name},</p>
        <p>Your session with <strong>${appointment.counselor_name}</strong> is confirmed for:</p>
        <p style="font-size: 16px; margin: 16px 0;"><strong>${dateStr}</strong><br/>${timeStr}</p>
        ${
          isOnline
            ? `<p>This is an online session. Your join link will become available on your <strong>Dashboard</strong> starting 30 minutes before your appointment time — it won't work before then, so no need to save or share it early.</p>`
            : counselor?.clinicAddress
            ? `<p>This is an in-person session at:</p><p style="font-size: 15px; margin: 16px 0;">${counselor.clinicAddress}</p><p>Please arrive 15 minutes early.</p>`
            : `<p>This is an in-person session. Please check your dashboard for location details.</p>`
        }
        <p style="margin-top: 24px;">You can view or manage this booking anytime from your dashboard.</p>
      </div>
    `;

    await resend.emails.send({
      from: "Psychology Embassy <contact@psychologyembassy.com>",
      to: [appointment.patient_email],
      subject: `Session Confirmed — ${dateStr}`,
      html: patientHtml,
    });

    // ── Counselor email — gets the real link immediately, no gating.
    if (appointment.counselor_email) {
      const counselorHtml = `
        <div style="font-family: sans-serif; color: #3A3A38; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2C4C5B;">New Session Booked</h2>
          <p>Hello ${appointment.counselor_name},</p>
          <p><strong>${appointment.patient_name}</strong> (${appointment.patient_email}) has booked and paid for a session with you:</p>
          <p style="font-size: 16px; margin: 16px 0;"><strong>${dateStr}</strong><br/>${timeStr}</p>
          ${
            isOnline
              ? meetingLink
                ? `<p>Meeting link: <a href="${meetingLink}">${meetingLink}</a></p>`
                : `<p style="color: #A65D47;">No meeting link is set for your account yet — please add one in your profile so patients can join.</p>`
              : `<p>This is an in-person session.</p>`
          }
          <p style="margin-top: 24px;">You can view full session details, including any pre-session notes, in your Counselor Portal.</p>
        </div>
      `;

      await resend.emails.send({
        from: "Psychology Embassy <contact@psychologyembassy.com>",
        to: [appointment.counselor_email],
        subject: `New Booking — ${appointment.patient_name} on ${dateStr}`,
        html: counselorHtml,
      });
    }
  } catch (error) {
    // Never let an email failure break the payment confirmation flow —
    // the appointment is already paid and saved regardless of email outcome.
    console.error("Appointment confirmation email error:", error);
  }
}