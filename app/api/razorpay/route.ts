import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabase } from "../../../lib/supabase";
import { client } from "../../../lib/sanity";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(request: Request) {
  const body = await request.json();

  try {
    // ---------------------------------------------------------
    // SCENARIO 1: Paying for a 1-on-1 Appointment
    // ---------------------------------------------------------
    if (body.appointmentId) {
      const { data: apt } = await supabase
        .from("appointments")
        .select("total_price, status")
        .eq("id", body.appointmentId)
        .single();

      if (!apt || apt.status !== "pending") {
        return NextResponse.json({ error: "Invalid appointment" }, { status: 400 });
      }

      const order = await razorpay.orders.create({
        amount: apt.total_price * 100,
        currency: "INR",
        receipt: "receipt_apt_" + body.appointmentId,
      });
      return NextResponse.json({ orderId: order.id });
    }

    // ---------------------------------------------------------
    // SCENARIO 2: Paying for a Program Application (The Fix!)
    // ---------------------------------------------------------
    if (body.applicationId) {
      // 1. Verify the application is accepted in Supabase
      const { data: app } = await supabase
        .from("program_applications")
        .select("program_id, status")
        .eq("id", body.applicationId)
        .single();

      if (!app || app.status !== "accepted") {
        return NextResponse.json({ error: "Invalid application" }, { status: 400 });
      }

      // 2. Fetch the actual program price securely from Sanity
      const programData = await client.fetch(
        `*[_id == $programId][0]{ price }`,
        { programId: app.program_id }
      );

      if (!programData || !programData.price) {
        return NextResponse.json({ error: "Price not found" }, { status: 404 });
      }

      // 3. Create the order
      const order = await razorpay.orders.create({
        amount: programData.price * 100, // Razorpay expects paisa (amount * 100)
        currency: "INR",
        receipt: "receipt_prog_" + body.applicationId,
      });
      return NextResponse.json({ orderId: order.id });
    }

    // If neither ID was passed
    return NextResponse.json({ error: "No valid ID provided" }, { status: 400 });

  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json({ error: "Error creating order" }, { status: 500 });
  }
}