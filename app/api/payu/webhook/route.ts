import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../../lib/sanity";
import { Resend } from "resend";

// Secure server-side Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    const { status, txnid, hash, udf1, amount, firstname, email, productinfo } = data;

    // 1. Verify PayU Hash to ensure security
    const salt = process.env.PAYU_MERCHANT_SALT!;
    const hashString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY}`;
    const calcHash = crypto.createHash("sha512").update(hashString).digest("hex");

    if (calcHash !== hash) {
      return NextResponse.json({ error: "Invalid hash" }, { status: 400 });
    }

    const targetTable = txnid.toString().startsWith("PG_") ? "program_applications" : "appointments";

    if (status === "success") {
      // 2. Update Database: Mark as paid and save Transaction ID
      await supabaseAdmin
        .from(targetTable)
        .update({ status: "paid", payment_order_id: txnid })
        .eq("id", udf1);

      // 3. SEND EMAILS IF IT IS AN APPOINTMENT
      if (targetTable === "appointments") {
        
        // A. Fetch the appointment details
        const { data: appointment } = await supabaseAdmin
          .from("appointments")
          .select("*")
          .eq("id", udf1)
          .single();

        if (appointment && appointment.counselor_id) {
          // B. Fetch Counselor details from Sanity
          const counselor = await client.fetch(
            `*[_type == "counselor" && _id == $id][0]{ name, email }`,
            { id: appointment.counselor_id }
          );

          if (counselor) {
            // C. Format Dates and Times for the email
            const aptDate = new Date(appointment.appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            
            const startHour = Math.min(...appointment.time_slots);
            const endHour = Math.max(...appointment.time_slots) + 1;
            
            const formatTime = (h: number) => {
              const ampm = h >= 12 ? 'PM' : 'AM';
              const formattedH = h % 12 || 12;
              return `${formattedH < 10 ? '0' : ''}${formattedH}:00 ${ampm}`;
            };
            const timeString = `${formatTime(startHour)} - ${formatTime(endHour)}`;

            // D. SEND EMAIL TO PATIENT
            if (appointment.patient_email) {
              await resend.emails.send({
                from: "The Psychology Embassy <bookings@contact.psychologyembassy.com>", // Make sure this domain is verified in Resend!
                to: appointment.patient_email,
                subject: "Your Session is Confirmed! 🎉",
                html: `
                  <div style="font-family: sans-serif; color: #3A3A38; max-w: 600px; margin: 0 auto;">
                    <h2 style="color: #2C4C5B;">Session Confirmed!</h2>
                    <p>Your appointment has been successfully booked and paid for.</p>
                    <div style="background-color: #FBF8F2; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e5e5e5;">
                      <p style="margin: 5px 0;"><strong>Counselor:</strong> ${counselor.name}</p>
                      <p style="margin: 5px 0;"><strong>Date:</strong> ${aptDate}</p>
                      <p style="margin: 5px 0;"><strong>Time:</strong> ${timeString}</p>
                      <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${amount}</p>
                      <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${txnid}</p>
                    </div>
                    <p><strong>How to join your session:</strong></p>
                    <p style="color: #666;">For your privacy and security, meeting links are not sent via email. Your <strong>"Join Video Session"</strong> button will activate exactly 15 minutes before your session begins inside your Patient Dashboard.</p>
                    <br/>
                    <a href="https://thepsychologyembassy.com/dashboard" style="background-color: #4F6F52; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Go to My Dashboard</a>
                  </div>
                `
              });
            }

            // E. SEND EMAIL TO COUNSELOR
            if (counselor.email) {
              await resend.emails.send({
                from: "The Psychology Embassy <bookings@contact.psychologyembassy.com>",
                to: counselor.email,
                subject: "New Session Booked!",
                html: `
                  <div style="font-family: sans-serif; color: #3A3A38; max-w: 600px; margin: 0 auto;">
                    <h2 style="color: #2C4C5B;">New Appointment Booked</h2>
                    <p>A patient has just booked a new session with you.</p>
                    <div style="background-color: #FBF8F2; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e5e5e5;">
                      <p style="margin: 5px 0;"><strong>Date:</strong> ${aptDate}</p>
                      <p style="margin: 5px 0;"><strong>Time:</strong> ${timeString}</p>
                    </div>
                    <p>Please log in to your Counselor Portal to view the patient's details and manage your schedule.</p>
                    <br/>
                    <a href="https://thepsychologyembassy.com/counselor-portal" style="background-color: #4F6F52; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Open Counselor Portal</a>
                  </div>
                `
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}