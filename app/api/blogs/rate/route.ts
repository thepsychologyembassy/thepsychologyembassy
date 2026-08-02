import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client } from "../../../../lib/sanity";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 0. REQUIRE AUTHENTICATION
    // Comments/ratings are only accepted from signed-up, logged-in users.
    // The client sends the Supabase access token it got from signing in;
    // we verify it server-side rather than trusting anything the client claims.
    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!accessToken) {
      return NextResponse.json(
        { error: "You need to sign in to rate or comment on articles." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Your session has expired. Please sign in again." },
        { status: 401 }
      );
    }

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
    // The display name defaults to the account's name if the user didn't
    // override it, but the identity that matters (user_id) always comes
    // from the verified session, never from the request body.
    const fallbackName =
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      (typeof user.email === "string" && user.email.split("@")[0]) ||
      null;

    const securePayload = {
      blog_id,
      blog_slug: validBlog.slug || null,
      user_id: user.id,
      rating: numericRating,
      comment: comment?.trim() || null,
      commenter_name: commenter_name?.trim() || fallbackName,
    };

    // Upsert so a signed-in reader has exactly one rating/comment per
    // article; submitting again updates it instead of creating a duplicate.
    // Requires a unique constraint on (blog_id, user_id) — see the SQL
    // migration in supabase/migrations.
    const { error } = await supabaseAdmin
      .from("blog_ratings")
      .upsert([securePayload], { onConflict: "blog_id,user_id" });

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Thank you for rating this article." });
  } catch (error) {
    console.error("Blog Rating Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}