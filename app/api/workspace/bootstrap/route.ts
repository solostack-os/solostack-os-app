import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  // 1. Get the authenticated user via the SSR client (respects cookies/session)
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Service-role client for admin operations (bypasses RLS — needed for subscriptions insert)
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Check if a profile already exists → workspace already bootstrapped
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    const { data: workspace } = await admin
      .from("workspaces")
      .select("id")
      .eq("owner_user_id", user.id)
      .single();

    return NextResponse.json({
      workspace_id: workspace?.id ?? null,
      is_new: false,
    });
  }

  // 4. Bootstrap: profile → workspace → subscription (sequential, service-role)
  const fullName = (user.user_metadata?.full_name as string) || "";
  const signupCompanyName = (user.user_metadata?.company_name as string) || "";
  const signupIndustry = (user.user_metadata?.industry as string) || "";
  const signupCompanyUrl = (user.user_metadata?.company_url as string) || "";

  const { error: profileError } = await admin.from("profiles").insert({
    id: user.id,
    email: user.email,
    full_name: fullName,
  });

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to create profile", detail: profileError.message },
      { status: 500 }
    );
  }

  const workspaceName = fullName ? `${fullName}'s Workspace` : "My Workspace";

  const { data: workspace, error: wsError } = await admin
    .from("workspaces")
    .insert({
      owner_user_id: user.id,
      name: workspaceName,
      ...(signupCompanyName ? { company_name: signupCompanyName } : {}),
      ...(signupIndustry ? { industry: signupIndustry } : {}),
      ...(signupCompanyUrl ? { website: signupCompanyUrl } : {}),
    })
    .select("id")
    .single();

  if (wsError || !workspace) {
    // Rollback profile
    await admin.from("profiles").delete().eq("id", user.id);
    return NextResponse.json(
      { error: "Failed to create workspace", detail: wsError?.message },
      { status: 500 }
    );
  }

  const trialEndsAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: subError } = await admin.from("subscriptions").insert({
    workspace_id: workspace.id,
    plan_key: "trial",
    status: "trialing",
    trial_ends_at: trialEndsAt,
  });

  if (subError) {
    // Rollback workspace + profile
    await admin.from("workspaces").delete().eq("id", workspace.id);
    await admin.from("profiles").delete().eq("id", user.id);
    return NextResponse.json(
      { error: "Failed to create subscription", detail: subError?.message },
      { status: 500 }
    );
  }

  // Send welcome email for new trial users (non-blocking)
  if (user.email) {
    try {
      await resend.emails.send({
        from: "Dragos at SoloStack <dragos@solostack.io>",
        replyTo: "dragos@solostack.io",
        to: user.email,
        subject: "your SoloStack workspace is ready",
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px;">
    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;">SoloStack OS</h1>
    <p style="color:#6c8cff;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 32px;">Trial — 7 Days Free</p>

    <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin:0 0 16px;">Welcome. Your workspace is ready.</h2>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
      You have 60 credits and 7 days to explore SoloStack OS — AI-powered marketing, outreach, and operations, all in one place.
    </p>

    <div style="background:rgba(108,140,255,0.06);border:1px solid rgba(108,140,255,0.15);border-radius:12px;padding:20px 24px;margin:0 0 28px;">
      <p style="color:#94a3b8;font-size:14px;margin:0 0 12px;font-weight:500;">Get started in 3 steps:</p>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 8px;line-height:1.5;">→ Set up your <strong style="color:#f1f5f9;">Brand Context</strong> in Settings — this makes every output feel like yours, not a template.</p>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 8px;line-height:1.5;">→ Run your first workflow in <strong style="color:#f1f5f9;">Marketing</strong> or <strong style="color:#f1f5f9;">Outreach</strong>.</p>
      <p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.5;">→ Try <strong style="color:#f1f5f9;">Operations</strong> for proposals, onboarding docs, and client assets.</p>
    </div>

    <div style="margin:0 0 28px;">
      <a href="https://solostack.io/app"
         style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6c8cff,#818cf8);color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
        Open your workspace →
      </a>
    </div>

    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
      If anything feels off or you get stuck — reply here. I read every message.
    </p>

    <p style="color:#475569;font-size:13px;line-height:1.6;margin:0 0 0;">
      📬 If this landed in Promotions, move it to Primary so you don't miss updates from us.
    </p>

    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;margin-top:32px;">
      <p style="color:#475569;font-size:13px;margin:0 0 4px;">Dragos · <a href="mailto:dragos@solostack.io" style="color:#6c8cff;text-decoration:none;">dragos@solostack.io</a></p>
      <p style="color:#475569;font-size:13px;margin:0;">&copy; 2026 SoloStack OS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      });
    } catch (emailErr) {
      console.error("[bootstrap] Failed to send welcome email:", emailErr);
    }
  }

  return NextResponse.json({
    workspace_id: workspace.id,
    is_new: true,
  });
}
