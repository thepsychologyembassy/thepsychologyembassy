import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, resetRateLimit, formatRetryMessage } from "../../../../lib/rateLimit";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { allowed, retryAfterSeconds } = await checkRateLimit("login", email);
  if (!allowed) {
    return NextResponse.json({ error: formatRetryMessage(retryAfterSeconds, "login") }, { status: 429 });
  }

  // Plain anon-key client for this one request - we're just proxying the
  // real sign-in through our server so it can be rate-limited first.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json({ error: error?.message || "Invalid login credentials" }, { status: 401 });
  }

  // Successful login: clear the counter so a real user who mistyped their
  // password once or twice isn't stuck waiting out the window next time.
  await resetRateLimit("login", email);

  return NextResponse.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  });
}
