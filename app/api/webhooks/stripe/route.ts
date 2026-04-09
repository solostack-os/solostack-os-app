import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: Request) {
  // 1. Verify webhook signature (use raw body)
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. Handle events
  switch (event.type) {
    // ── Checkout completed: activate subscription ──
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = session.subscription as string;
      const workspaceId = session.metadata?.workspaceId;
      if (!workspaceId) break;

      // Cast to include `current_period_end` — recent versions of the
      // stripe npm types dropped it from the top-level Subscription type
      // (the field still exists at runtime on the API response). Goes
      // through `unknown` because Response<Subscription> doesn't overlap
      // cleanly enough for a direct cast.
      const subscription = (await stripe.subscriptions.retrieve(
        subscriptionId
      )) as unknown as Stripe.Subscription & {
        current_period_start: number;
        current_period_end: number;
      };
      const priceId = subscription.items.data[0].price.id;

      let planKey = "trial";
      if (priceId === process.env.STRIPE_STARTER_PRICE_ID) planKey = "starter";
      else if (priceId === process.env.STRIPE_PRO_PRICE_ID) planKey = "pro";

      await admin.from("subscriptions").upsert(
        {
          workspace_id: workspaceId,
          plan_key: planKey,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          status: "active",
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
        },
        { onConflict: "workspace_id" }
      );
      break;
    }

    // ── Subscription updated: sync status + period ──
    case "customer.subscription.updated": {
      // See note above — current_period_end is missing from the current
      // Stripe.Subscription type definition but still present at runtime.
      const subscription = event.data.object as Stripe.Subscription & {
        current_period_start: number;
        current_period_end: number;
      };
      const customerId = subscription.customer as string;

      const { data: workspace } = await admin
        .from("workspaces")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();
      if (!workspace) break;

      const priceId = subscription.items.data[0].price.id;
      let planKey = "trial";
      if (priceId === process.env.STRIPE_STARTER_PRICE_ID) planKey = "starter";
      else if (priceId === process.env.STRIPE_PRO_PRICE_ID) planKey = "pro";

      await admin
        .from("subscriptions")
        .update({
          plan_key: planKey,
          stripe_price_id: priceId,
          status: subscription.status,
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
        })
        .eq("workspace_id", workspace.id);
      break;
    }

    // ── Subscription deleted: revert to trial ──
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data: workspace } = await admin
        .from("workspaces")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();
      if (!workspace) break;

      await admin
        .from("subscriptions")
        .update({
          plan_key: "trial",
          status: "trialing",
          stripe_subscription_id: null,
          stripe_price_id: null,
          current_period_end: null,
        })
        .eq("workspace_id", workspace.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
