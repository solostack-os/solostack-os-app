import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  // 1. Authenticate
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse request body
  const { priceId } = await request.json();
  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  }

  // 3. Get workspace
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

  // 4. Create Stripe Customer if none exists
  let customerId = workspace.stripe_customer_id as string | null;

  async function ensureFreshCustomer() {
    const customer = await stripe.customers.create({
      email: user!.email,
      metadata: { workspaceId: workspace!.id },
    });
    await admin
      .from("workspaces")
      .update({ stripe_customer_id: customer.id })
      .eq("id", workspace!.id);
    return customer.id;
  }

  if (!customerId) {
    customerId = await ensureFreshCustomer();
  }

  // 5. Cancel any existing active/trialing subscriptions for this customer.
  //    This prevents duplicate billing when a user upgrades or changes plans.
  //    We cancel immediately (not at period end) since the new plan checkout
  //    will be the source of truth going forward.
  if (customerId) {
    try {
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 10,
      });
      for (const sub of existingSubs.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
      // Also cancel any trialing subscriptions
      const trialingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 10,
      });
      for (const sub of trialingSubs.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    } catch (cancelErr) {
      // Non-fatal — log but proceed. Worst case: Stripe's own deduplication
      // or the webhook handler will resolve the state.
      console.error("[checkout] Failed to cancel existing subscriptions:", cancelErr);
    }
  }

  // 6. Create Checkout Session
  // If the stored customer ID is stale (e.g. from test mode), recreate it and retry once.
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
      metadata: { workspaceId: workspace.id },
    });
  } catch (err: unknown) {
    const stripeErr = err as { code?: string };
    if (stripeErr?.code === "resource_missing") {
      customerId = await ensureFreshCustomer();
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        allow_promotion_codes: true,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?upgraded=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
        metadata: { workspaceId: workspace.id },
      });
    } else {
      throw err;
    }
  }

  return NextResponse.json({ url: session.url });
}
