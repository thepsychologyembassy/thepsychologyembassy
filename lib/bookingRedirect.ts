"use client";

import { supabase } from "./supabase";

type RouterLike = { push: (href: string) => void };

/**
 * Sends the user straight into the booking flow instead of the /book
 * landing page:
 *  - Not logged in            -> /login, then back to /book/intake
 *  - Has a draft intake       -> resume that draft
 *  - Already matched/booked   -> back to their top-3 matches (reselect)
 *  - Nothing on file yet      -> fresh /book/intake
 *
 * NOTE: the dashboard's own "Book a Session" (empty-state) button
 * intentionally still routes to /book (the landing page) so returning
 * clients can scroll through the team and site before starting a new
 * intake - that button should NOT use this helper.
 */
export async function startBookingFlow(router: RouterLike) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/login?redirect=/book/intake");
    return;
  }

  try {
    const { data: existing } = await supabase
      .from("intake_sessions")
      .select("id, status")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      if (existing.status === "draft") {
        router.push(`/book/intake?session=${existing.id}`);
      } else {
        router.push(`/book/match?session=${existing.id}&reselect=1`);
      }
      return;
    }
  } catch (err) {
    console.error("Failed to check for an existing intake session:", err);
  }

  router.push("/book/intake");
}
