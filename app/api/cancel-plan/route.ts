import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

      if (subs.data.length) {
        subscriptionId = subs.data[0].id;

        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });

        // Persist the corrected subscription ID so future calls work
        await admin
          .from("subscriptions")
          .update({ stripe_subscription_id: subscriptionId })
          .eq("workspace_id", workspace.id);
      } else {
        // No live Stripe subscription found (e.g. test/manually-seeded account).
        // Fall through — DB will be marked as canceling below; access expires
        // naturally at current_period_end without needing Stripe involvement.
        console.warn("[cancel-plan] No live Stripe subscription found for customer", customerId, "— marking DB only");
      }
    } catch (lookupErr) {
      console.error("[cancel-plan] Customer lookup error:", lookupErr);
      // Non-fatal: still mark DB as canceling so the UI reflects the intent.
    }
  }

  // 4. Persist the flag locally so the UI reflects it immediately
  await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("workspace_id", workspace.id);

  // 5. Send cancellation confirmation email (non-blocking)
  const userEmail = (await supabase.auth.getUser()).data.user?.email ?? "";
  const periodEndDate = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (userEmail) {
    try {
      await resend.emails.send({
        from: "SoloStack <noreply@solostack.io>",
        to: userEmail,
        subject: "Your SoloStack subscription has been cancelled",
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px;">
    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;">SoloStack OS</h1>
    <p style="color:#6c8cff;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 32px;">Subscription Cancelled</p>

    <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin:0 0 16px;">We've received your cancellation</h2>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Your subscription has been cancelled and will not renew.${periodEndDate ? ` You'll continue to have full access to SoloStack OS until <strong style="color:#f1f5f9;">${periodEndDate}</strong>.` : " Your access will continue until the end of the current billing period."}
    </p>

    <div style="background:rgba(108,140,255,0.06);border:1px solid rgba(108,140,255,0.15);border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <p style="color:#94a3b8;font-size:14px;margin:0 0 4px;">After your access ends, your account will revert to the <strong style="color:#f1f5f9;">Trial tier</strong> with a fresh 30-credit allocation. Your workspace data will be preserved.</p>
    </div>

    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 8px;">
      Changed your mind? You can resubscribe at any time from your Settings page.
    </p>

    <div style="margin:24px 0;">
      <a href="https://solostack.io/app/settings"
         style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6c8cff,#818cf8);color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
        Go to Settings →
      </a>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;margin-top:32px;">
      <p style="color:#475569;font-size:13px;margin:0 0 4px;">Questions? <a href="mailto:support@solostack.io" style="color:#6c8cff;text-decoration:none;">support@solostack.io</a></p>
      <p style="color:#475569;font-size:13px;margin:0;">&copy; 2026 SoloStack OS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      });
    } catch (emailErr) {
      console.error("[cancel-plan] Failed to send cancellation email:", emailErr);
    }
  }

  return NextResponse.json({
    success: true,
    periodEnd: sub.current_period_end,
  });
}
