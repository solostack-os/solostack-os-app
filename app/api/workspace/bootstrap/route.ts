import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

  return NextResponse.json({
    workspace_id: workspace.id,
    is_new: true,
  });
}
