import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../../lib/sanity"; // Make sure this path matches your project structure

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. SECURE JWT VERIFICATION
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Invalid session or token" }, { status: 401 });
    }

    // 2. CRITICAL FIX: VERIFY ADMIN ROLE VIA SANITY
    const settings = await client.fetch(`*[_type == "siteSettings"][0]{ adminEmails }`);
    const adminEmails = settings?.adminEmails || [];
    
    if (!adminEmails.includes(user.email)) {
      console.warn(`SECURITY ALERT: Non-admin ${user.email} attempted to revoke an application.`);
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { appId } = await request.json();
    if (!appId) return NextResponse.json({ error: "Application ID required" }, { status: 400 });

    // 3. SECURE DATABASE WRITE
    const { data: app, error } = await supabaseAdmin
      .from("program_applications")
      .update({ status: "expired" })
      .eq("id", appId)
      .select().single();

    if (error || !app) return NextResponse.json({ error: "Failed to revoke application" }, { status: 500 });

    // 4. AUDIT LOGGING
    await supabaseAdmin.from("admin_logs").insert([{
      admin_email: user.email,
      action: "revoked_application",
      target_id: appId,
      details: `Revoked application for ${app.applicant_email}`
    }]);

    return NextResponse.json({ success: true, message: "Application successfully revoked." });
  } catch (error) {
    console.error("Revoke Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}