import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    // ── Checkout completed: activate subscription OR credit refill ──
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      if (!workspaceId) break;

      // ── One-time credit refill ──────────────────────────────────────
      if (session.mode === "payment" && session.metadata?.type === "refill") {
        const creditsToAdd = parseInt(session.metadata?.credits ?? "100", 10);

        // Increment extra_credits on the workspace's subscription
        const { data: sub } = await admin
          .from("subscriptions")
          .select("extra_credits")
          .eq("workspace_id", workspaceId)
          .single();

        const current = (sub?.extra_credits as number) ?? 0;
        await admin
          .from("subscriptions")
          .update({ extra_credits: current + creditsToAdd })
          .eq("workspace_id", workspaceId);

        console.log(
          `[webhook] Refill: +${creditsToAdd} credits for workspace ${workspaceId}`
        );
        break;
      }

      // ── New subscription checkout ───────────────────────────────────
      const subscriptionId = session.subscription as string;

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

      // Send welcome email (non-blocking)
      const customerEmail = session.customer_details?.email ?? session.customer_email ?? "";
      const planLabel = planKey === "pro" ? "Pro" : "Starter";
      if (customerEmail) {
        try {
          await resend.emails.send({
            from: "SoloStack <noreply@solostack.io>",
            to: customerEmail,
            subject: `Welcome to SoloStack OS — you're in.`,
            html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px;">
    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;">SoloStack OS</h1>
    <p style="color:#6c8cff;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 32px;">${planLabel} Plan — Active</p>

    <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin:0 0 16px;">You're in. Let's build.</h2>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Your SoloStack OS workspace is ready. You now have access to the full ${planLabel} plan — AI-powered marketing, outreach, and operations, all in one context.
    </p>

    <div style="background:rgba(108,140,255,0.06);border:1px solid rgba(108,140,255,0.15);border-radius:12px;padding:20px 24px;margin:0 0 28px;">
      <p style="color:#94a3b8;font-size:14px;margin:0 0 12px;font-weight:500;">A few things to start with:</p>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 8px;line-height:1.5;">→ Set up your <strong style="color:#f1f5f9;">Brand Context</strong> — this is what makes every output feel like yours, not a template.</p>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 8px;line-height:1.5;">→ Run your first workflow in <strong style="color:#f1f5f9;">Marketing</strong> or <strong style="color:#f1f5f9;">Outreach</strong>.</p>
      <p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.5;">→ Check <strong style="color:#f1f5f9;">Operations</strong> for proposals, onboarding docs, and client assets.</p>
    </div>

    <div style="margin:0 0 28px;">
      <a href="https://solostack.io/app"
         style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6c8cff,#818cf8);color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
        Open your workspace →
      </a>
    </div>

    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 0;">
      If anything's unclear or doesn't work the way you expect — reply to this email. It goes directly to the founder.
    </p>

    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;margin-top:32px;">
      <p style="color:#475569;font-size:13px;margin:0 0 4px;">Questions? <a href="mailto:support@solostack.io" style="color:#6c8cff;text-decoration:none;">support@solostack.io</a></p>
      <p style="color:#475569;font-size:13px;margin:0;">&copy; 2026 SoloStack OS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
          });
        } catch (emailErr) {
          console.error("[webhook] Failed to send welcome email:", emailErr);
        }
      }

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
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
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
          cancel_at_period_end: false,
        })
        .eq("workspace_id", workspace.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
