import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCalendarConnectionStatus } from "../../../../lib/googleCalendar";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getCalendarConnectionStatus(user.id);
  return NextResponse.json({
    connected: !!status,
    googleEmail: status?.google_email || null,
  });
}
