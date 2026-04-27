// lib/track.ts
// Lightweight event tracking — inserts to user_events table.
// Client-side version uses browser Supabase client.
// Server-side: use admin client directly (see app/api/runs/route.ts).

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
 * Dedup is enforced by the partial unique index (user_events_one_time_unique)
 * — the insert silently no-ops on conflict.
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

    await supabase.from("user_events").upsert(
      { user_id: user.id, event_name: eventName, event_data: eventData },
      { onConflict: "user_id,event_name", ignoreDuplicates: true }
    );
  } catch {
    // Non-blocking.
  }
}
