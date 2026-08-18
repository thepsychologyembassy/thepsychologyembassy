import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, formatRetryMessage, getClientIp } from "../../../../lib/rateLimit";

export async function POST(request: Request) {
  const { email, redirectTo } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Rate limited by device (IP address), not by account.
  const clientIp = getClientIp(request);
  const { allowed, retryAfterSeconds } = await checkRateLimit("password_reset", clientIp);
  if (!allowed) {
    return NextResponse.json({ error: formatRetryMessage(retryAfterSeconds, "reset") }, { status: 429 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}