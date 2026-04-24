// lib/track.ts
// Lightweight event tracking — inserts to user_events table.
// Client-side version uses browser Supabase client.
// Server-side: use trackEventServer() with admin client.

import { createClient } from "@/lib/supabase/client";

/** Log an event for the current user (client-side). */
export async function trackEvent(
  eventName: string,
  eventData: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_events").insert({
      user_id: user.id,
      event_name: eventName,
      event_data: eventData,
    });
  } catch {
    // Non-blocking — attribution tracking should never break the app.
  }
}

/**
 * Log an event only if it hasn't been logged before for this user.
 * Used for one-time events like first_workflow_run.
 */
export async function trackEventOnce(
  eventName: string,
  eventData: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from("user_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_name", eventName);

    if (count && count > 0) return;

    await supabase.from("user_events").insert({
      user_id: user.id,
      event_name: eventName,
      event_data: eventData,
    });
  } catch {
    // Non-blocking.
  }
}
