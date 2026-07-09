import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, firstname, email, productinfo } = body;

    const key = process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    const txnid = "TXN_" + Date.now() + Math.floor(Math.random() * 1000);

    // PayU Strict Hash Formula
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    return NextResponse.json({ hash, txnid, key });
  } catch (error) {
    console.error("Hash generation error:", error);
    return NextResponse.json({ error: "Hash generation failed" }, { status: 500 });
  }
}