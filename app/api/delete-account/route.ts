import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/delete-account
 * 1. Sends a goodbye email with a feedback link
 * 2. Cancels any active Stripe subscription immediately
 * 3. Deletes the Supabase auth user (cascades to workspace + subscriptions)
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

  const userEmail = user.email ?? "";

  // 2. Send goodbye email (non-blocking — don't fail deletion if email fails)
  if (userEmail) {
    try {
      await resend.emails.send({
        from: "SoloStack <onboarding@resend.dev>",
        to: userEmail,
        subject: "Your SoloStack account has been deleted",
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px;">
    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;">SoloStack OS</h1>
    <p style="color:#6c8cff;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 32px;">Account Deleted</p>

    <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin:0 0 16px;">Sorry to see you go</h2>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Your SoloStack OS account and all associated data have been permanently deleted as requested. Any active subscription has been cancelled.
    </p>

    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 8px;">
      We'd love to understand what we could have done better. If you have a moment, we'd really appreciate your feedback:
    </p>

    <div style="margin:24px 0;">
      <a href="mailto:support@solostack.io?subject=Feedback%20on%20SoloStack%20OS&body=Hi%2C%20I%20just%20deleted%20my%20account.%20Here%27s%20why%3A%0A%0A"
         style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6c8cff,#818cf8);color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
        Share feedback →
      </a>
    </div>

    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
      If you ever decide to come back, you're always welcome. We'll keep building.
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
      console.error("[delete-account] Failed to send goodbye email:", emailErr);
    }
  }

  // 3. Cancel Stripe subscription if active (immediate cancellation)
  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: workspace } = await admin
      .from("workspaces")
      .select("id, stripe_customer_id")
      .eq("owner_user_id", user.id)
      .single();

    if (workspace?.stripe_customer_id) {
      const { data: sub } = await admin
        .from("subscriptions")
        .select("stripe_subscription_id, status")
        .eq("workspace_id", workspace.id)
        .single();

      if (sub?.stripe_subscription_id && sub.status === "active") {
        try {
          await stripe.subscriptions.cancel(sub.stripe_subscription_id);
        } catch {
          // Stale sub ID — try via customer lookup
          try {
            const subs = await stripe.subscriptions.list({
              customer: workspace.stripe_customer_id,
              status: "active",
              limit: 1,
            });
            if (subs.data.length) {
              await stripe.subscriptions.cancel(subs.data[0].id);
            }
          } catch {
            console.warn("[delete-account] Could not cancel Stripe subscription");
          }
        }
      }
    }
  } catch {
    console.warn("[delete-account] Error during Stripe cancellation step");
  }

  // 4. Delete the auth user (cascades to all linked data)
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("[delete-account] Failed to delete user:", deleteError);
    return NextResponse.json({ error: "Failed to delete account. Please contact support." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
