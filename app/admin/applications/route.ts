import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../lib/sanity";

// We use the Service Role key here to ensure we can fetch the applications 
// even if Row Level Security (RLS) is blocking regular users.
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

  // 3. Cross-Reference with Sanity Site Settings on the Server
  const settings = await client.fetch(`*[_type == "siteSettings"][0]`);
  const authorizedEmails: string[] = settings?.adminEmails || [];

  if (!authorizedEmails.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
  }

  // 4. If they pass, fetch and return the applications
  const { data, error } = await supabaseAdmin
    .from("program_applications")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Database error" }, { status: 500 });

  return NextResponse.json({ applications: data });
}