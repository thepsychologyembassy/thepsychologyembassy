import { NextResponse } from "next/server";
import { saveGoogleTokensFromCode } from "../../../../lib/googleCalendar";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  // Default redirect if we can't even decode state (shouldn't normally happen)
  let redirectTo = "/dashboard";

  try {
    if (!stateRaw) throw new Error("Missing state");
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf-8"));
    redirectTo = state.redirectTo || "/dashboard";

    if (errorParam) {
      // User clicked "Cancel" on Google's consent screen — not an error
      // worth logging, just send them back.
      return NextResponse.redirect(`${url.origin}${redirectTo}?calendar=cancelled`, 303);
    }

    if (!code || !state.userId || !state.email) {
      throw new Error("Missing code or state fields");
    }

    await saveGoogleTokensFromCode(code, state.userId, state.email);

    return NextResponse.redirect(`${url.origin}${redirectTo}?calendar=connected`, 303);
  } catch (error) {
    console.error("Google Calendar callback error:", error);
    return NextResponse.redirect(`${url.origin}${redirectTo}?calendar=error`, 303);
  }
}
