import { NextResponse } from "next/server";
import crypto from "crypto";
import { client } from "../../../../lib/sanity";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Extracting identifiers instead of trusting a client-provided amount
    const { firstname, email, productinfo, counselor_id, slots_count } = body;

    if (!counselor_id || !slots_count) {
      return NextResponse.json({ error: "Missing booking identifiers" }, { status: 400 });
    }

    // 1. Fetch the real, untamperable price securely from Sanity
    const counselor = await client.fetch(
      `*[_type == "counselor" && _id == $id][0]`, 
      { id: counselor_id },
      { cache: 'no-store' }
    );
    
    if (!counselor || !counselor.fees) {
      return NextResponse.json({ error: "Invalid counselor data" }, { status: 400 });
    }

    // 2. Calculate the exact amount on the server
    const secureAmount = counselor.fees * slots_count;

    const key = process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    const txnid = "TXN_" + Date.now() + Math.floor(Math.random() * 1000);

    // 3. Generate strict hash with the SERVER'S calculated amount
    const hashString = `${key}|${txnid}|${secureAmount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // 4. Return the secure amount back to the client so the form matches the hash
    return NextResponse.json({ hash, txnid, key, amount: secureAmount });
  } catch (error) {
    console.error("Hash generation error:", error);
    return NextResponse.json({ error: "Hash generation failed" }, { status: 500 });
  }
}