import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabase } from "../../../lib/supabase";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appointmentId } = await request.json();

  // Fetch real amount from DB — never trust client
  const { data: apt } = await supabase
    .from("appointments")
    .select("total_price, status")
    .eq("id", appointmentId)
    .single();

  if (!apt || apt.status !== "pending")
    return NextResponse.json({ error: "Invalid appointment" }, { status: 400 });

  try {
    const order = await razorpay.orders.create({
      amount: apt.total_price * 100,
      currency: "INR",
      receipt: "receipt_" + appointmentId,
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json({ error: "Error creating order" }, { status: 500 });
  }
}