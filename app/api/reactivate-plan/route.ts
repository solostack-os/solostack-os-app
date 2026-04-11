import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/reactivate-plan
 * Reverses a cancel_at_period_end cancellation — keeps the existing
 * subscription active, no new charge, no new checkout required.
 */
export async function POST() {
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
    .select("stripe_subscription_id, status, cancel_at_period_end")
    .eq("workspace_id", workspace.id)
    .single();

  if (!sub || sub.status !== "active") {
    return NextResponse.json({ error: "No active subscription to reactivate" }, { status: 400 });
  }

  if (!sub.cancel_at_period_end) {
    return NextResponse.json({ error: "Subscription is not scheduled for cancellation" }, { status: 400 });
  }

  // Remove the cancel_at_period_end flag — subscription continues as normal
  let subscriptionId = sub.stripe_subscription_id;

  try {
    if (!subscriptionId) throw new Error("no_id");

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  } catch {
    // Stale ID fallback — find live subscription via customer
    const customerId = workspace.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
    }

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
      cancel_at_period_end: false,
    });

    await admin
      .from("subscriptions")
      .update({ stripe_subscription_id: subscriptionId })
      .eq("workspace_id", workspace.id);
  }

  // Reflect the change locally
  await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: false })
    .eq("workspace_id", workspace.id);

  return NextResponse.json({ success: true });
}
