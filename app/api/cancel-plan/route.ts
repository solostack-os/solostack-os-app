import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/cancel-plan
 * Sets cancel_at_period_end = true on the active Stripe subscription.
 * Credits remain valid until the current period end; after that the
 * webhook (customer.subscription.deleted) reverts the workspace to trial.
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
    .select("id")
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

  if (!sub || !sub.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  if (sub.status !== "active") {
    return NextResponse.json({ error: "Subscription is not active" }, { status: 400 });
  }

  // 3. Tell Stripe to cancel at period end
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

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
