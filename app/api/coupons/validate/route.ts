import { NextResponse } from "next/server";
import { validateCoupon } from "../../../../lib/coupons";

export async function POST(req: Request) {
  try {
    const { code, patient_email } = await req.json();

    if (!code || !patient_email) {
      return NextResponse.json(
        { valid: false, error: "Missing coupon code or email." },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, patient_email);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Server error validating coupon." },
      { status: 500 }
    );
  }
}