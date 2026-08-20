import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../../lib/sanity";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: Request) {
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

    // 2. VERIFY ADMIN ROLE VIA SANITY (same allowlist used everywhere else)
    const settings = await client.fetch(`*[_type == "siteSettings" && _id == "siteSettings"][0]{ adminEmails }`);
    const adminEmails = settings?.adminEmails || [];

    if (!adminEmails.includes(user.email)) {
      console.warn(`SECURITY ALERT: Non-admin ${user.email} attempted to delete past appointments.`);
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 3. PERMANENTLY DELETE ANYTHING DATED BEFORE THE START OF TODAY
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data: deleted, error } = await supabaseAdmin
      .from("appointments")
      .delete()
      .lt("appointment_date", startOfToday.toISOString())
      .select("id");

    if (error) return NextResponse.json({ error: "Failed to delete past appointments" }, { status: 500 });

    const deletedCount = deleted?.length || 0;

    // 4. AUDIT LOGGING
    await supabaseAdmin.from("admin_logs").insert([{
      admin_email: user.email,
      action: "deleted_past_appointments",
      details: `Permanently deleted ${deletedCount} past appointment(s) (before ${startOfToday.toISOString().slice(0, 10)})`
    }]);

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error("Delete Past Appointments Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
