import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/refill
 * Creates a Stripe one-time checkout session to purchase 100 extra credits.
 * Works only for paid (non-trial) workspaces — trial users are directed to upgrade instead.
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

  // 2. Get workspace + stripe customer id
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

  // 3. Ensure the workspace has a valid Stripe customer record
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

  const priceId = process.env.STRIPE_REFILL_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "Refill price not configured" },
      { status: 500 }
    );
  }

  // 4. Create a one-time payment checkout session
  // If the stored customer ID is stale (e.g. from test mode), recreate it and retry once.
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?refilled=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
      metadata: { workspaceId: workspace.id, type: "refill", credits: "100" },
    });
  } catch (err: unknown) {
    const stripeErr = err as { code?: string };
    if (stripeErr?.code === "resource_missing") {
      // Customer ID is stale — create a fresh one and retry
      customerId = await ensureFreshCustomer();
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?refilled=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
        metadata: { workspaceId: workspace.id, type: "refill", credits: "100" },
      });
    } else {
      throw err;
    }
  }

  return NextResponse.json({ url: session.url });
}
