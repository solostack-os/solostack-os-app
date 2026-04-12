import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

/**
 * POST /api/billing/sync
 *
 * Directly fetches the user's current Stripe subscription and syncs the
 * latest state (cancel_at_period_end, status, period dates) to Supabase.
 *
 * Used by the Settings page when the user returns from the Stripe Customer
 * Portal. Instead of relying on a webhook to arrive within an arbitrary
 * timeout, we pull the ground truth straight from Stripe so the UI always
 * reflects the actual subscription state immediately.
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

  // Get workspace + current subscription
  const { data: workspace } = await admin
    .from("workspaces")
    .select("id, stripe_customer_id")
    .eq("owner_user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { data: currentSub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, plan_key, current_period_start, extra_credits")
    .eq("workspace_id", workspace.id)
    .single();

  if (!currentSub?.stripe_subscription_id) {
    // No active subscription — nothing to sync
    return NextResponse.json({ synced: false, reason: "no_subscription" });
  }

  let subscription: Stripe.Subscription & {
    current_period_start: number;
    current_period_end: number;
  };

  try {
    subscription = (await stripe.subscriptions.retrieve(
      currentSub.stripe_subscription_id
    )) as unknown as Stripe.Subscription & {
      current_period_start: number;
      current_period_end: number;
    };
  } catch {
    return NextResponse.json(
      { error: "Could not fetch subscription from Stripe" },
      { status: 502 }
    );
  }

  const priceId = subscription.items.data[0].price.id;
  let planKey = "trial";
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) planKey = "starter";
  else if (priceId === process.env.STRIPE_PRO_PRICE_ID) planKey = "pro";

  const newPeriodStart = new Date(
    subscription.current_period_start * 1000
  ).toISOString();

  const planChanged = currentSub.plan_key !== planKey;
  const periodRenewed =
    currentSub.current_period_start != null &&
    newPeriodStart > currentSub.current_period_start;

  await admin
    .from("subscriptions")
    .update({
      plan_key: planKey,
      stripe_price_id: priceId,
      status: subscription.status,
      current_period_start: newPeriodStart,
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      ...(planChanged || periodRenewed ? { extra_credits: 0 } : {}),
    })
    .eq("workspace_id", workspace.id);

  return NextResponse.json({
    synced: true,
    cancel_at_period_end: subscription.cancel_at_period_end,
    status: subscription.status,
    plan_key: planKey,
  });
}
