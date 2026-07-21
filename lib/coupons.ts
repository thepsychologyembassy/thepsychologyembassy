import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type CouponValidationResult =
  | { valid: true; coupon: { code: string; discount_percent: number } }
  | { valid: false; error: string };

/**
 * Server-side-only coupon validation. Never trust a discount percentage sent
 * from the client - always re-derive it here.
 *
 * Rules enforced:
 * - Coupon must exist and be active
 * - Coupon must be within its starts_at/expires_at window (if set)
 * - A given patient_email can redeem a given coupon code only once
 *   (enforced by the unique constraint on coupon_redemptions, checked here
 *   up front for a nicer error message)
 * - first_booking_only coupons are rejected if the client already has a
 *   paid appointment on record
 */
export async function validateCoupon(
  rawCode: string,
  patientEmail: string
): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, error: "Please enter a coupon code." };

  const { data: coupon, error } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();

  if (error || !coupon) {
    return { valid: false, error: "Invalid coupon code." };
  }

  const now = new Date();
  if (coupon.starts_at && now < new Date(coupon.starts_at)) {
    return { valid: false, error: "This coupon isn't active yet." };
  }
  if (coupon.expires_at && now >= new Date(coupon.expires_at)) {
    return { valid: false, error: "This coupon has expired." };
  }

  const { data: existingRedemption } = await supabaseAdmin
    .from("coupon_redemptions")
    .select("id")
    .eq("coupon_code", code)
    .eq("patient_email", patientEmail)
    .maybeSingle();

  if (existingRedemption) {
    return { valid: false, error: "You've already used this coupon." };
  }

  if (coupon.first_booking_only) {
    const { count } = await supabaseAdmin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("patient_email", patientEmail)
      .eq("status", "paid");

    if ((count || 0) > 0) {
      return { valid: false, error: "This coupon is only valid for your first session." };
    }
  }

  return { valid: true, coupon: { code: coupon.code, discount_percent: coupon.discount_percent } };
}
