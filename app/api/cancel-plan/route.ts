import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/cancel-plan
 * Sets cancel_at_period_end = true on the active Stripe subscription.
 * Handles stale/test-mode subscription IDs by falling back to a customer
 * subscription lookup — same pattern as the checkout/refill routes.
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

  // 2. Get workspace + subscription
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: workspace } = await admin
    .from("workspaces")
    .select("id, stripe_customer_id")
    .eq("owner_user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, plan_key, status, current_period_end")
    .eq("workspace_id", workspace.id)
    .single();

  if (!sub || sub.status !== "active") {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  // 3. Try to cancel the stored subscription ID; fall back to customer lookup
  //    if it's stale (test-mode ID in a live-mode account).
  let subscriptionId: string | null = sub.stripe_subscription_id;

  try {
    if (!subscriptionId) throw new Error("no_id");

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (err: unknown) {
    const stripeErr = err as { code?: string; message?: string };
    const isStale =
      stripeErr?.code === "resource_missing" ||
      stripeErr?.message?.includes("No such subscription") ||
      (err instanceof Error && err.message === "no_id");

    if (!isStale) {
      console.error("[cancel-plan] Stripe error:", err);
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }

    // Stale/missing subscription ID — find the live one via customer
    const customerId = workspace.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
    }

    try {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (!subs.data.length) {
        return NextResponse.json({ error: "No active Stripe subscription found" }, { status: 400 });
      }

      subscriptionId = subs.data[0].id;

      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // Persist the corrected subscription ID so future calls work
      await admin
        .from("subscriptions")
        .update({ stripe_subscription_id: subscriptionId })
        .eq("workspace_id", workspace.id);
    } catch (lookupErr) {
      console.error("[cancel-plan] Customer lookup error:", lookupErr);
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }
  }

  // 4. Persist the flag locally so the UI reflects it immediately
  await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("workspace_id", workspace.id);

  return NextResponse.json({
    success: true,
    periodEnd: sub.current_period_end,
  });
}
