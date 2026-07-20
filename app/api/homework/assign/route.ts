import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateFiles, uploadFilesToStorage } from "../../../../lib/uploads";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user?.email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const formData = await request.formData();
    const appointmentId = formData.get("appointmentId") as string | null;
    const homework = (formData.get("homework") as string | null) || "";
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
    }

    const fileError = validateFiles(files);
    if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });

    // Confirm this counselor actually owns the appointment.
    const counselorEmail = user.email.toLowerCase().trim();
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from("appointments")
      .select("id, counselor_email, patient_email, patient_name, counselor_name")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    if (appointment.counselor_email !== counselorEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let uploaded: Awaited<ReturnType<typeof uploadFilesToStorage>> = [];
    if (files.length > 0) {
      uploaded = await uploadFilesToStorage(supabaseAdmin, files, `homework/${appointmentId}`);
    }

    const { error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({ homework, homework_files: uploaded })
      .eq("id", appointmentId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save homework" }, { status: 500 });
    }

    // Best-effort notification to the patient.
    try {
      if (appointment.patient_email) {
        await resend.emails.send({
          from: "The Psychology Embassy <bookings@contact.psychologyembassy.com>",
          to: appointment.patient_email,
          subject: "New homework from your psychologist",
          html: `
            <div style="font-family: sans-serif; color: #3A3A38;">
              <h2 style="color:#2C4C5B;">Homework Assigned</h2>
              <p>${appointment.counselor_name || "Your psychologist"} has assigned you homework${uploaded.length ? " with attached files" : ""}.</p>
              <p>Log in to your dashboard to view and download it.</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Non-fatal: homework notification email failed:", emailErr);
    }

    return NextResponse.json({ success: true, homework_files: uploaded });
  } catch (error) {
    console.error("Homework assign error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
