import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { runSocialPosts, type SocialPostsInput } from "@/lib/workflows/marketing/social-posts";
import { runTopicSuggestions, type TopicSuggestionsInput } from "@/lib/workflows/marketing/topic-suggestions";
import { runAdCopy, type AdCopyInput } from "@/lib/workflows/marketing/ad-copy";
import { runLandingPage, type LandingPageInput } from "@/lib/workflows/marketing/landing-page";
import { runEmailCampaign, type EmailCampaignInput } from "@/lib/workflows/marketing/email-campaign";
import { runContentBrief, type ContentBriefInput } from "@/lib/workflows/marketing/content-brief";
import { runColdEmail, type ColdEmailInput } from "@/lib/workflows/outreach/cold-email";
import { runFollowUp, type FollowUpInput } from "@/lib/workflows/outreach/follow-up";
import { runProposal, type ProposalInput } from "@/lib/workflows/outreach/proposal";
import { runDiscoveryPrep, type DiscoveryPrepInput } from "@/lib/workflows/outreach/discovery-prep";

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

  // Service-role client for inserts/updates that lack RLS policies
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. Get workspace + context
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { data: context } = await supabase
    .from("workspace_context")
    .select("main_goal, business_type, offer, target_audience, tone, brand_notes")
    .eq("workspace_id", workspace.id)
    .single();

  // 3. Parse request body
  const body = await request.json();
  const { module_key, workflow_key, input_json } = body as {
    module_key: string;
    workflow_key: string;
    input_json: Record<string, unknown>;
  };

  // 3a. Helper workflows bypass usage gate and run tracking
  if (module_key === "marketing" && workflow_key === "topic_suggestions") {
    try {
      const result = await runTopicSuggestions(
        context ?? {},
        input_json as unknown as TopicSuggestionsInput
      );
      return NextResponse.json({ output_markdown: result.text });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // 4. Usage gate — count runs vs plan cap
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_key")
    .eq("workspace_id", workspace.id)
    .single();

  if (subscription) {
    const { data: plan } = await admin
      .from("plans")
      .select("run_cap")
      .eq("key", subscription.plan_key)
      .single();

    if (plan?.run_cap !== null && plan?.run_cap !== undefined) {
      const { count } = await admin
        .from("runs")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id);

      if (count !== null && count >= plan.run_cap) {
        return NextResponse.json(
          { error: "Credit limit reached. Please upgrade your plan." },
          { status: 403 }
        );
      }
    }
  }

  // 5. Create run record (status: running)
  const { data: run, error: runError } = await admin
    .from("runs")
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      module_key,
      workflow_key,
      status: "running",
      input_json,
      context_snapshot_json: context ?? {},
      model_provider: "anthropic",
      model_name: "claude-haiku-4-5-20251001",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (runError || !run) {
    return NextResponse.json(
      { error: "Failed to create credit", detail: runError?.message },
      { status: 500 }
    );
  }

  // 6. Execute the workflow
  try {
    let text: string;
    let promptTokens = 0;
    let completionTokens = 0;

    let outputTitle = "";

    if (module_key === "marketing" && workflow_key === "social_posts") {
      const result = await runSocialPosts(
        context ?? {},
        input_json as unknown as SocialPostsInput
      );
      text = result.text;
      promptTokens = result.promptTokens;
      completionTokens = result.completionTokens;
      outputTitle = `Social posts — ${input_json.platform}`;
    } else if (module_key === "marketing" && workflow_key === "ad_copy") {
      const result = await runAdCopy(
        context ?? {},
        input_json as unknown as AdCopyInput
      );
      text = result.text;
      promptTokens = result.promptTokens;
      completionTokens = result.completionTokens;
      outputTitle = `Ad copy — ${input_json.platform}`;
    } else if (module_key === "marketing" && workflow_key === "landing_page") {
      const result = await runLandingPage(
        context ?? {},
        input_json as unknown as LandingPageInput
      );
      text = result.text;
      promptTokens = result.promptTokens;
      completionTokens = result.completionTokens;
      outputTitle = `Landing page — ${input_json.section}`;
    } else if (module_key === "marketing" && workflow_key === "email_campaign") {
      const result = await runEmailCampaign(
        context ?? {},
        input_json as unknown as EmailCampaignInput
      );
      text = result.text;
      promptTokens = result.promptTokens;
      completionTokens = result.completionTokens;
      outputTitle = `Email — ${input_json.email_type}`;
    } else if (module_key === "marketing" && workflow_key === "content_brief") {
      const result = await runContentBrief(
        context ?? {},
        input_json as unknown as ContentBriefInput
      );
      text = result.text;
      promptTokens = result.promptTokens;
      completionTokens = result.completionTokens;
      outputTitle = `Content brief — ${input_json.content_type}`;
    } else if (module_key === "outreach" && workflow_key === "cold_email") {
      const result = await runColdEmail(
        context ?? {},
        input_json as unknown as ColdEmailInput
      );
      text = result.text;
      promptTokens = result.promptTokens;
      completionTokens = result.completionTokens;
      outputTitle = `Cold email — ${input_json.prospect_company}`;
    } else if (module_key === "outreach" && workflow_key === "follow_up") {
      const result = await runFollowUp(
        context ?? {},
        input_json as unknown as FollowUpInput
      );
      text = result.text;
      promptTokens = result.promptTokens;
      completionTokens = result.completionTokens;
      outputTitle = `Follow-up — ${input_json.days_since}`;
    } else if (module_key === "outreach" && workflow_key === "proposal") {
      const result = await runProposal(
        context ?? {},
        input_json as unknown as ProposalInput
      );
      text = result.text;
      promptTokens = result.promptTokens;
      completionTokens = result.completionTokens;
      outputTitle = `Proposal — ${input_json.client_name}`;
    } else if (module_key === "outreach" && workflow_key === "discovery_prep") {
      const result = await runDiscoveryPrep(
        context ?? {},
        input_json as unknown as DiscoveryPrepInput
      );
      text = result.text;
      promptTokens = result.promptTokens;
      completionTokens = result.completionTokens;
      outputTitle = `Discovery prep — ${input_json.prospect_company}`;
    } else {
      throw new Error(`Unknown workflow: ${module_key}/${workflow_key}`);
    }

    // 7. Save output
    const { data: output } = await admin
      .from("outputs")
      .insert({
        run_id: run.id,
        title: outputTitle,
        output_markdown: text,
      })
      .select("id, output_markdown")
      .single();

    // 8. Mark run completed
    await admin
      .from("runs")
      .update({
        status: "completed",
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return NextResponse.json({
      run_id: run.id,
      output_id: output?.id,
      output_markdown: output?.output_markdown,
    });
  } catch (err) {
    // Mark run failed
    const message = err instanceof Error ? err.message : "Unknown error";
    await admin
      .from("runs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
