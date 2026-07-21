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
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ error: "Please choose at least one file" }, { status: 400 });
    }

    const fileError = validateFiles(files);
    if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });

    const patientEmail = user.email.toLowerCase().trim();
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from("appointments")
      .select("id, patient_email, counselor_email, counselor_name, patient_name, homework")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    if (appointment.patient_email !== patientEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!appointment.homework) {
      return NextResponse.json({ error: "No homework has been assigned for this session yet" }, { status: 400 });
    }

    const uploaded = await uploadFilesToStorage(supabaseAdmin, files, `submissions/${appointmentId}`);

    const { error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({ homework_submission_files: uploaded })
      .eq("id", appointmentId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
    }

    try {
      if (appointment.counselor_email) {
        await resend.emails.send({
          from: "The Psychology Embassy <bookings@contact.psychologyembassy.com>",
          to: appointment.counselor_email,
          subject: "Homework submitted by client",
          html: `
            <div style="font-family: sans-serif; color: #3A3A38;">
              <h2 style="color:#2C4C5B;">Homework Submitted</h2>
              <p>${appointment.patient_name || "Your client"} has uploaded their completed homework.</p>
              <p>Log in to your psychologist portal to review it.</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Non-fatal: submission notification email failed:", emailErr);
    }

    return NextResponse.json({ success: true, homework_submission_files: uploaded });
  } catch (error) {
    console.error("Homework submit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
