import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use the Service Role key to securely write to the database
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { 
      program_id, 
      program_title, 
      program_type, 
      applicant_name, 
      applicant_email, 
      statement_of_purpose, 
      resume_link 
    } = body;

    // Build the payload on the server where the client cannot tamper with it
    const securePayload = {
      program_id,
      program_title,
      program_type,
      applicant_name,
      applicant_email,
      statement_of_purpose,
      resume_link,
      status: "pending", // HARDCODED ON SERVER: Attackers can no longer force "accepted" or "paid"
    };

    const { error } = await supabaseAdmin
      .from("program_applications")
      .insert([securePayload]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Application secured and submitted." });
  } catch (error) {
    console.error("Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}