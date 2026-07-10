import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use the Service Role key to securely bypass RLS for admin operations
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
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session or token" }, { status: 401 });
    }

    const { appId } = await request.json();
    if (!appId) return NextResponse.json({ error: "Application ID required" }, { status: 400 });

    // 2. SECURE DATABASE WRITE
    const { data: app, error } = await supabaseAdmin
      .from("program_applications")
      .update({ status: "expired" }) // Marks it as expired to open the seat up
      .eq("id", appId)
      .select().single();

    if (error || !app) return NextResponse.json({ error: "Failed to revoke application" }, { status: 500 });

    return NextResponse.json({ success: true, message: "Application successfully revoked." });
  } catch (error) {
    console.error("Revoke Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}