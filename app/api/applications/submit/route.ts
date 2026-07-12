import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../../lib/sanity";

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

    // 1. STRICT DATA TYPE & LENGTH VALIDATION
    if (!program_id || !applicant_name || !applicant_email || !statement_of_purpose) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (applicant_name.length > 100) return NextResponse.json({ error: "Name too long" }, { status: 400 });
    if (statement_of_purpose.length > 5000) return NextResponse.json({ error: "Statement of purpose exceeds maximum length" }, { status: 400 });
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicant_email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // 2. ANTI-SPAM / RATE LIMITING (Max 1 application per email per 24 hours)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const { count, error: countError } = await supabaseAdmin
      .from("program_applications")
      .select("*", { count: 'exact', head: true })
      .eq("applicant_email", applicant_email)
      .gte("created_at", yesterday.toISOString());

    if (countError) throw countError;
    if (count && count >= 1) {
      return NextResponse.json({ error: "You have already submitted an application recently. Please wait 24 hours." }, { status: 429 });
    }

    // 3. SANITY INTEGRITY CHECK: Does this program actually exist?
    const validProgram = await client.fetch(
      `*[_id == $id][0]{ _id }`, 
      { id: program_id }
    );

    if (!validProgram) {
      return NextResponse.json({ error: "Invalid program ID" }, { status: 400 });
    }

    // 4. SECURE PAYLOAD CONSTRUCTION
    const securePayload = {
      program_id,
      program_title,
      program_type,
      applicant_name,
      applicant_email,
      statement_of_purpose,
      resume_link,
      status: "pending", 
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