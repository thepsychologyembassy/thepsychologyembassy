import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../lib/sanity";

// Service Role key so we can read across all clients, bypassing RLS.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  // 1. Get the user's session token from the request headers
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Missing token" }, { status: 401 });
  const token = authHeader.replace("Bearer ", "");

  // 2. Verify the user securely on the server
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Cross-reference with Sanity site settings, same admin allowlist used
  // by the applications and appointments dashboards.
  const settings = await client.fetch(`*[_type == "siteSettings" && _id == "siteSettings"][0]`);
  const authorizedEmails: string[] = settings?.adminEmails || [];

  if (!authorizedEmails.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
  }

  // 4. Fetch every submitted intake form (excludes abandoned drafts nobody
  // finished), most recently submitted first.
  const { data, error } = await supabaseAdmin
    .from("intake_sessions")
    .select("*")
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  // 5. Resolve counselor names (selected + matched) from Sanity in one round trip
  // so the list can show who each form was matched/assigned to.
  const counselorIds = new Set<string>();
  (data || []).forEach((s) => {
    if (s.selected_counselor_id) counselorIds.add(s.selected_counselor_id);
    (s.matched_counselor_ids || []).forEach((id: string) => counselorIds.add(id));
  });

  let counselorMap: Record<string, string> = {};
  if (counselorIds.size > 0) {
    const counselors = await client.fetch(
      `*[_type == "counselor" && _id in $ids]{ _id, name }`,
      { ids: Array.from(counselorIds) }
    );
    counselorMap = Object.fromEntries(counselors.map((c: any) => [c._id, c.name]));
  }

  const enriched = (data || []).map((s) => ({
    ...s,
    selected_counselor_name: s.selected_counselor_id ? counselorMap[s.selected_counselor_id] || null : null,
    matched_counselor_names: (s.matched_counselor_ids || [])
      .map((id: string) => counselorMap[id])
      .filter(Boolean),
  }));

  return NextResponse.json({ intakeForms: enriched });
}
