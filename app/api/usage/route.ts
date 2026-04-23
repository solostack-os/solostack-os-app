import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { CREDITS_PER_RUN } from "@/lib/constants";

/**
 * GET /api/usage
 * Returns the current credit usage for the authenticated user's workspace.
 * Used by client pages to initialise credit-limit UI state on mount.
 */
export async function GET() {
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

  // Get workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ remaining: null, limitReached: false });
  }

  // Get subscription + plan
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("plan_key, status, current_period_start, extra_credits")
    .eq("workspace_id", workspace.id)
    .single();

  if (!subscription) {
    return NextResponse.json({ remaining: null, limitReached: false, planKey: "trial" });
  }

  const { data: plan } = await admin
    .from("plans")
    .select("run_cap")
    .eq("key", subscription.plan_key)
    .single();

  if (!plan?.run_cap) {
    return NextResponse.json({ remaining: null, limitReached: false, planKey: subscription.plan_key });
  }

  // Count runs in current period
  const isTrial = subscription.plan_key === "trial";
  const periodStart = !isTrial ? subscription.current_period_start : null;

  let runsQuery = admin
    .from("runs")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .neq("is_sample", true);

  if (periodStart) {
    runsQuery = runsQuery.gte("created_at", periodStart);
  }

  const { count } = await runsQuery;

  const extraCredits = (subscription as { extra_credits?: number }).extra_credits ?? 0;
  const creditsUsed = (count ?? 0) * CREDITS_PER_RUN;
  const effectiveCap = plan.run_cap + extraCredits;
  const remaining = effectiveCap - creditsUsed;
  const limitReached = remaining < CREDITS_PER_RUN;

  return NextResponse.json({
    remaining,
    limitReached,
    planKey: subscription.plan_key,
  });
}
