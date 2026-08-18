import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15; // attempts are counted within a rolling window this long
const LOCKOUT_MINUTES = 15; // once locked, how long before they can try again

export type RateLimitAction = "login" | "password_reset";

/**
 * Best-effort client IP extraction. Vercel (and most reverse proxies) set
 * x-forwarded-for to "client, proxy1, proxy2, ..." - the first entry is the
 * original visitor. Falls back to x-real-ip, then "unknown" (e.g. local dev
 * without a proxy in front), which just means all such requests share one
 * bucket - fine for dev, never happens in production on Vercel.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Call before doing the real work. identifier is whatever we're rate
 * limiting by - typically the caller's IP address (see getClientIp), so the
 * limit applies per device/network rather than per account. Returns
 * { allowed: false, retryAfterSeconds } once this identifier has hit 5
 * attempts within the last 15 minutes - the caller should refuse the
 * request without even touching Supabase Auth.
 */
export async function checkRateLimit(action: RateLimitAction, rawIdentifier: string) {
  const identifier = rawIdentifier.trim();
  const now = new Date();

  const { data: existing } = await supabaseAdmin
    .from("auth_rate_limits")
    .select("attempt_count, window_started_at, locked_until")
    .eq("action", action)
    .eq("identifier", identifier)
    .maybeSingle();

  if (existing?.locked_until && new Date(existing.locked_until) > now) {
    const retryAfterSeconds = Math.ceil((new Date(existing.locked_until).getTime() - now.getTime()) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  const windowStart = existing?.window_started_at ? new Date(existing.window_started_at) : now;
  const windowExpired = !existing || now.getTime() - windowStart.getTime() > WINDOW_MINUTES * 60 * 1000;

  const nextCount = windowExpired ? 1 : (existing?.attempt_count ?? 0) + 1;
  const nextWindowStart = windowExpired ? now : windowStart;

  let lockedUntil: Date | null = null;
  if (nextCount > MAX_ATTEMPTS) {
    lockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
  }

  await supabaseAdmin.from("auth_rate_limits").upsert(
    {
      action,
      identifier,
      attempt_count: nextCount,
      window_started_at: nextWindowStart.toISOString(),
      locked_until: lockedUntil ? lockedUntil.toISOString() : null,
      updated_at: now.toISOString(),
    },
    { onConflict: "action,identifier" }
  );

  if (lockedUntil) {
    const retryAfterSeconds = Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

/** Call on a successful login so a real user isn't stuck waiting out the window. */
export async function resetRateLimit(action: RateLimitAction, rawIdentifier: string) {
  const identifier = rawIdentifier.trim();
  await supabaseAdmin.from("auth_rate_limits").delete().eq("action", action).eq("identifier", identifier);
}

export function formatRetryMessage(retryAfterSeconds: number | undefined, verb: string) {
  const minutes = Math.max(1, Math.ceil((retryAfterSeconds || 0) / 60));
  return `Too many ${verb} attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}