import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * GET /api/account/export
 * GDPR data export — returns a downloadable JSON file containing:
 *   profile, brand profile, generations (last 12 months), subscription.
 *
 * Rate-limited to 1 export per 24 hours per user via user_events table.
 */
export async function GET() {
  /* ── 1. Authenticate ── */
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
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  /* ── 2. Rate limit: 1 export per 24h ── */
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();

  const { count: recentExports } = await admin
    .from("user_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_name", "data_export")
    .gte("created_at", twentyFourHoursAgo);

  if ((recentExports ?? 0) > 0) {
    return NextResponse.json(
      { error: "Export limit reached. You can request one export every 24 hours." },
      { status: 429 },
    );
  }

  /* ── 3. Fetch workspace (needed for all subsequent queries) ── */
  const { data: workspace } = await admin
    .from("workspaces")
    .select(
      "id, company_name, website, industry, description, brand_voice, preferred_language, use_brand_context, created_at",
    )
    .eq("owner_user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json(
      { error: "No workspace found for this account." },
      { status: 404 },
    );
  }

  /* ── 4. Parallel queries ── */
  const twelveMonthsAgo = new Date(
    Date.now() - 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [profileRes, contextRes, subscriptionRes, runsRes] = await Promise.all([
    admin
      .from("profiles")
      .select("email, full_name, created_at")
      .eq("id", user.id)
      .single(),

    admin
      .from("workspace_context")
      .select(
        "main_goal, business_type, offer, target_audience, tone, brand_notes",
      )
      .eq("workspace_id", workspace.id)
      .single(),

    admin
      .from("subscriptions")
      .select(
        "plan_key, status, trial_ends_at, current_period_start, current_period_end, cancel_at_period_end, extra_credits, created_at",
      )
      .eq("workspace_id", workspace.id)
      .single(),

    admin
      .from("runs")
      .select(
        "id, module_key, workflow_key, status, input_json, started_at, completed_at, created_at",
      )
      .eq("workspace_id", workspace.id)
      .gte("created_at", twelveMonthsAgo)
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  /* ── 5. Fetch outputs for retrieved runs ── */
  const runIds = (runsRes.data ?? []).map((r) => r.id);

  const outputs: Record<string, Array<{ title: string | null; output_markdown: string | null; edited_output: string | null; created_at: string }>> = {};

  if (runIds.length > 0) {
    // Supabase .in() supports up to ~30k items; 5000 is safe
    const { data: outputRows } = await admin
      .from("outputs")
      .select("run_id, title, output_markdown, edited_output, created_at")
      .in("run_id", runIds);

    for (const o of outputRows ?? []) {
      const rid = o.run_id as string;
      if (!outputs[rid]) outputs[rid] = [];
      outputs[rid].push({
        title: o.title,
        output_markdown: o.output_markdown,
        edited_output: o.edited_output,
        created_at: o.created_at,
      });
    }
  }

  /* ── 6. Assemble export payload ── */
  const exportData = {
    exported_at: new Date().toISOString(),
    account: {
      email: profileRes.data?.email ?? user.email,
      full_name: profileRes.data?.full_name ?? null,
      created_at: profileRes.data?.created_at ?? null,
    },
    brand_profile: {
      company_name: workspace.company_name,
      website: workspace.website,
      industry: workspace.industry,
      description: workspace.description,
      brand_voice: workspace.brand_voice,
      preferred_language: workspace.preferred_language,
      use_brand_context: workspace.use_brand_context,
      workspace_created_at: workspace.created_at,
    },
    business_context: contextRes.data ?? null,
    subscription: subscriptionRes.data
      ? {
          plan: subscriptionRes.data.plan_key,
          status: subscriptionRes.data.status,
          trial_ends_at: subscriptionRes.data.trial_ends_at,
          current_period_start: subscriptionRes.data.current_period_start,
          current_period_end: subscriptionRes.data.current_period_end,
          cancel_at_period_end: subscriptionRes.data.cancel_at_period_end,
          extra_credits: subscriptionRes.data.extra_credits,
          created_at: subscriptionRes.data.created_at,
        }
      : null,
    generations: (runsRes.data ?? []).map((run) => ({
      id: run.id,
      module: run.module_key,
      workflow: run.workflow_key,
      status: run.status,
      input: run.input_json,
      started_at: run.started_at,
      completed_at: run.completed_at,
      created_at: run.created_at,
      outputs: outputs[run.id] ?? [],
    })),
  };

  /* ── 7. Log the export event (for rate limiting) ── */
  void admin
    .from("user_events")
    .insert({
      user_id: user.id,
      event_name: "data_export",
      event_data: { run_count: runsRes.data?.length ?? 0 },
    })
    .then(() => {}, () => {});

  /* ── 8. Return downloadable JSON ── */
  const email = (profileRes.data?.email ?? user.email ?? "user").replace(
    /[^a-zA-Z0-9@._-]/g,
    "",
  );
  const date = new Date().toISOString().slice(0, 10);
  const filename = `solostack-export-${email}-${date}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
