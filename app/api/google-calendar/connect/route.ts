import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getGoogleAuthUrl } from "../../../../lib/googleCalendar";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET so this can be used directly as a link href (window.location =
// "/api/google-calendar/connect?redirect=/dashboard"), not just fetch().
// Auth still comes from the Supabase session cookie/token in the
// Authorization header when called via fetch, OR a short-lived token
// query param for the plain-link case — see note below.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return NextResponse.json(
      { error: "Missing auth token. Use the connect button in the dashboard/portal." },
      { status: 401 }
    );
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user || !user.email) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // `state` round-trips through Google and back to our callback, carrying
  // who's connecting and where to send them afterwards. It's opaque to
  // Google — just a string we get back unchanged.
  const state = Buffer.from(
    JSON.stringify({ userId: user.id, email: user.email, redirectTo })
  ).toString("base64url");

  const url = getGoogleAuthUrl(state);
  return NextResponse.json({ url });
}
