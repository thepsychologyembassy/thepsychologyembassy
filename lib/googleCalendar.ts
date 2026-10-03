import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/google-calendar/callback`
  );
}

/**
 * Builds the URL that starts the Google consent flow. `state` carries the
 * Supabase user id (and where to send them back to afterwards) through the
 * redirect so the callback route knows whose token it just received.
 */
export function getGoogleAuthUrl(state: string) {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline", // required to get a refresh_token back
    prompt: "consent", // forces a refresh_token on every connect, even for repeat users
    scope: SCOPES,
    state,
  });
}

/**
 * Called once, right after the user approves access on Google's consent
 * screen. Exchanges the one-time `code` for a refresh token and saves it.
 */
export async function saveGoogleTokensFromCode(
  code: string,
  userId: string,
  userEmail: string
) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    // Happens if the user had already granted access before and Google
    // silently skipped issuing a new refresh_token. `prompt: "consent"`
    // above is specifically there to prevent this, but we guard anyway.
    throw new Error(
      "Google did not return a refresh token. Please remove The Psychology Embassy from your Google account's connected apps and try connecting again."
    );
  }

  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
  const { data: googleProfile } = await oauth2.userinfo.get();

  await supabaseAdmin.from("google_calendar_tokens").upsert(
    {
      user_id: userId,
      email: userEmail,
      refresh_token: tokens.refresh_token,
      google_email: googleProfile.email || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function disconnectGoogleCalendar(userId: string) {
  await supabaseAdmin.from("google_calendar_tokens").delete().eq("user_id", userId);
}

export async function getCalendarConnectionStatus(userId: string) {
  const { data } = await supabaseAdmin
    .from("google_calendar_tokens")
    .select("google_email, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  return data; // null if not connected
}

/**
 * Returns an authenticated calendar client for this user, or null if
 * they haven't connected Google Calendar. Never throws — callers treat
 * "not connected" as a normal, expected case.
 */
async function getCalendarClientForUser(userId: string) {
  const { data } = await supabaseAdmin
    .from("google_calendar_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data?.refresh_token) return null;

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: data.refresh_token });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

interface AppointmentForCalendar {
  id: string;
  patient_name: string;
  patient_email: string;
  counselor_name: string;
  counselor_email: string;
  appointment_date: string; // "YYYY-MM-DD"
  time_slots: number[]; // quarter-hour indices, e.g. [40,41,42,43] = 10:00-11:00
  modality: string;
  meeting_link: string | null;
}

// Quarter-hour slot index -> a Date for that moment on the given day, in
// the organisation's local time (Asia/Kolkata), matching how slots are
// interpreted everywhere else in the app (see lib/email.ts, cron route).
function slotToDate(appointment_date: string, slot: number) {
  const [y, m, d] = appointment_date.split("-").map(Number);
  const totalMinutes = slot * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  // Build an ISO string with the fixed +05:30 offset rather than relying
  // on the server's local timezone, so this is correct regardless of
  // where the app is deployed.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
}

function buildEventPayload(appointment: AppointmentForCalendar, forCounselor: boolean) {
  const sorted = [...appointment.time_slots].sort((a, b) => a - b);
  const startSlot = sorted[0];
  const endSlot = sorted[sorted.length - 1] + 1;

  const isOnline = appointment.modality === "online";
  const otherParty = forCounselor ? appointment.patient_name : appointment.counselor_name;

  return {
    summary: forCounselor
      ? `Session with ${appointment.patient_name}`
      : `Therapy Session with ${appointment.counselor_name}`,
    description: [
      `Session with ${otherParty}.`,
      isOnline && appointment.meeting_link ? `Join link: ${appointment.meeting_link}` : null,
      "Booked via The Psychology Embassy.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    start: { dateTime: slotToDate(appointment.appointment_date, startSlot), timeZone: "Asia/Kolkata" },
    end: { dateTime: slotToDate(appointment.appointment_date, endSlot), timeZone: "Asia/Kolkata" },
    location: isOnline ? appointment.meeting_link || undefined : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "popup", minutes: 10 },
      ],
    },
  };
}

/**
 * Creates a calendar event for whichever of the patient/counselor have
 * connected Google Calendar. Each gets their own independent event on
 * their own calendar (there's no shared "invite" — each side only has
 * OAuth access to their own account). Returns the event ids so the
 * caller can store them on the appointment row for later cancellation.
 *
 * Never throws: a Calendar failure must not block payment confirmation.
 * Looked-up user ids come from Supabase auth by email, since that's the
 * identity both patients and counselors share across the app.
 */
export async function createCalendarEventsForAppointment(
  appointment: AppointmentForCalendar
): Promise<{ patientEventId: string | null; counselorEventId: string | null }> {
  const result: { patientEventId: string | null; counselorEventId: string | null } = {
    patientEventId: null,
    counselorEventId: null,
  };

  try {
    const [patientUserId, counselorUserId] = await Promise.all([
      findAuthUserIdByEmail(appointment.patient_email),
      appointment.counselor_email ? findAuthUserIdByEmail(appointment.counselor_email) : null,
    ]);

    if (patientUserId) {
      const calendar = await getCalendarClientForUser(patientUserId);
      if (calendar) {
        const { data } = await calendar.events.insert({
          calendarId: "primary",
          requestBody: buildEventPayload(appointment, false),
        });
        result.patientEventId = data.id || null;
      }
    }

    if (counselorUserId) {
      const calendar = await getCalendarClientForUser(counselorUserId);
      if (calendar) {
        const { data } = await calendar.events.insert({
          calendarId: "primary",
          requestBody: buildEventPayload(appointment, true),
        });
        result.counselorEventId = data.id || null;
      }
    }
  } catch (error) {
    console.error("Google Calendar event creation error:", error);
  }

  return result;
}

/**
 * Deletes both calendar events for a cancelled appointment, if they
 * exist. Each deletion uses the respective owner's OAuth grant, same as
 * creation. Never throws.
 */
export async function deleteCalendarEventsForAppointment(appointment: {
  patient_email: string;
  counselor_email: string | null;
  patient_calendar_event_id: string | null;
  counselor_calendar_event_id: string | null;
}) {
  try {
    if (appointment.patient_calendar_event_id) {
      const userId = await findAuthUserIdByEmail(appointment.patient_email);
      if (userId) {
        const calendar = await getCalendarClientForUser(userId);
        if (calendar) {
          await calendar.events
            .delete({ calendarId: "primary", eventId: appointment.patient_calendar_event_id })
            .catch((err) => console.error("Failed to delete patient calendar event:", err));
        }
      }
    }

    if (appointment.counselor_calendar_event_id && appointment.counselor_email) {
      const userId = await findAuthUserIdByEmail(appointment.counselor_email);
      if (userId) {
        const calendar = await getCalendarClientForUser(userId);
        if (calendar) {
          await calendar.events
            .delete({ calendarId: "primary", eventId: appointment.counselor_calendar_event_id })
            .catch((err) => console.error("Failed to delete counselor calendar event:", err));
        }
      }
    }
  } catch (error) {
    console.error("Google Calendar event deletion error:", error);
  }
}

// Supabase's admin SDK has no "get user by email" lookup, so we page
// through listUsers and match. Fine at this app's scale; swap for a
// dedicated lookup table keyed by email if the user base grows large.
async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  if (!email) return null;
  let page = 1;
  const perPage = 1000;
  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) return null;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < perPage) return null; // last page
    page++;
  }
  return null;
}
