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
        text: `Hey,

Your SoloStack OS workspace is live. Here's what you have:

- 60 credits
- 7 days to explore
- Marketing, Outreach, and Operations — all ready to use

One thing worth doing first: go to Settings and fill in your Brand Context. It takes 2 minutes and makes every output feel like it came from you, not a template.

→ solostack.io/app

If anything feels off or you get stuck, just reply here. I read every message.

Dragos
SoloStack`,
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
