import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user?.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Service-role read, explicitly scoped to this user only — RLS also
    // enforces this, but we filter here too rather than relying on a
    // single layer of defense.
    const { data, error } = await supabaseAdmin
      .from("test_results")
      .select("id, tool_slug, tool_title, range_label, range_description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Could not load results" }, { status: 500 });
    }

    return NextResponse.json({ results: data || [] });
  } catch (err) {
    console.error("Test results fetch error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
