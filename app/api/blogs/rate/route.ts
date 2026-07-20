import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../lib/sanity";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { blog_id, rating, comment, commenter_name } = body;

    // 1. STRICT VALIDATION
    if (!blog_id || typeof blog_id !== "string") {
      return NextResponse.json({ error: "Missing blog_id" }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: "Rating must be a whole number between 1 and 5" }, { status: 400 });
    }

    if (comment && (typeof comment !== "string" || comment.length > 2000)) {
      return NextResponse.json({ error: "Comment is too long" }, { status: 400 });
    }

    if (commenter_name && (typeof commenter_name !== "string" || commenter_name.length > 100)) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    // 2. SANITY INTEGRITY CHECK: Does this blog actually exist?
    const validBlog = await client.fetch(
      `*[_type == "blog" && _id == $id][0]{ _id, "slug": slug.current }`,
      { id: blog_id }
    );

    if (!validBlog) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 });
    }

    // 3. SECURE PAYLOAD CONSTRUCTION
    const securePayload = {
      blog_id,
      blog_slug: validBlog.slug || null,
      rating: numericRating,
      comment: comment?.trim() || null,
      commenter_name: commenter_name?.trim() || null,
    };

    const { error } = await supabaseAdmin.from("blog_ratings").insert([securePayload]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Thank you for rating this article." });
  } catch (error) {
    console.error("Blog Rating Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
