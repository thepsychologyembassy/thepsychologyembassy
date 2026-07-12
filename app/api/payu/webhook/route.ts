import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Use Admin client to bypass RLS for server operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // PayU sends webhooks as Form Data, not JSON
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

    const {
      status, txnid, amount, productinfo, firstname, email, udf1, hash, key, additionalCharges
    } = data as Record<string, string>;

    if (!udf1) return NextResponse.json({ error: "No ID attached" }, { status: 400 });

    const salt = process.env.PAYU_MERCHANT_SALT;

    // PayU Reverse Hash Formula (Accounting for potential additional charges)
    const hashSequence = additionalCharges
      ? `${additionalCharges}|${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`
      : `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

    const calculatedHash = crypto.createHash("sha512").update(hashSequence).digest("hex");

// Authenticate the webhook request
    if (calculatedHash === hash) {
      if (status === "success") {
        if (txnid.startsWith("TXN_PRG_")) {
          await supabaseAdmin.from("program_applications").update({ status: "paid" }).eq("id", udf1);
        } else {
          await supabaseAdmin.from("appointments").update({ status: "paid" }).eq("id", udf1);
        }
      } else {
        if (!txnid.startsWith("TXN_PRG_")) {
          const { data: currentApp } = await supabaseAdmin
            .from("appointments")
            .select("status")
            .eq("id", udf1)
            .single();

          // Only delete if it hasn't already been successfully paid
          if (currentApp && currentApp.status !== "paid") {
            await supabaseAdmin.from("appointments").delete().eq("id", udf1);
          }
        }
      }
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid Hash Signature" }, { status: 400 });
    }
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}