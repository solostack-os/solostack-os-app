import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/delete-account
 * 1. Cancels any active Stripe subscription immediately
 * 2. Deletes the Supabase auth user (cascades to workspace + subscriptions)
 * 3. Returns { success: true } — client signs out and redirects to homepage
 */
export async function POST() {
  // 1. Authenticate
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. Cancel Stripe subscription if active (immediate, not at period end)
  try {
    const { data: workspace } = await admin
      .from("workspaces")
      .select("id, stripe_customer_id")
      .eq("owner_user_id", user.id)
      .single();

    if (workspace?.stripe_customer_id) {
      const { data: sub } = await admin
        .from("subscriptions")
        .select("stripe_subscription_id, status")
        .eq("workspace_id", workspace.id)
        .single();

      if (sub?.stripe_subscription_id && sub.status === "active") {
        try {
          await stripe.subscriptions.cancel(sub.stripe_subscription_id);
        } catch {
          // Stale sub ID — try via customer lookup
          try {
            const subs = await stripe.subscriptions.list({
              customer: workspace.stripe_customer_id,
              status: "active",
              limit: 1,
            });
            if (subs.data.length) {
              await stripe.subscriptions.cancel(subs.data[0].id);
            }
          } catch {
            // Non-fatal — continue with deletion
            console.warn("[delete-account] Could not cancel Stripe subscription");
          }
        }
      }
    }
  } catch {
    // Non-fatal — continue with deletion even if Stripe step fails
    console.warn("[delete-account] Error during Stripe cancellation step");
  }

  // 3. Delete the auth user (Supabase cascades to all linked data)
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("[delete-account] Failed to delete user:", deleteError);
    return NextResponse.json({ error: "Failed to delete account. Please contact support." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
