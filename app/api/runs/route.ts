import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { CLAUDE_MODEL } from "@/lib/ai/providers/anthropic";
import { CREDITS_PER_RUN } from "@/lib/constants";
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
import { runSopGenerator, type SopGeneratorInput } from "@/lib/workflows/operations/sop-generator";
import { runWeeklyPlan, type WeeklyPlanInput } from "@/lib/workflows/operations/weekly-plan";
import { runOnboardingDoc, type OnboardingDocInput } from "@/lib/workflows/operations/onboarding-doc";
import { runProcessNotes, type ProcessNotesInput } from "@/lib/workflows/operations/process-notes";

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

  // 2. Parse request body early — lets us short-circuit topic_suggestions
  //    before touching any workspace tables at all.
  const body = await request.json();
  const { module_key, workflow_key, input_json } = body as {
    module_key: string;
    workflow_key: string;
    input_json: Record<string, unknown>;
  };

  // 3. Helper workflows bypass the workspace fetch and usage gate entirely.
  // Topic suggestions are intentionally brand-agnostic — they don't receive
  // the workspace context so they can't accidentally personalise the ideas.
  if (module_key === "marketing" && workflow_key === "topic_suggestions") {
    try {
      const result = await runTopicSuggestions(
        input_json as unknown as TopicSuggestionsInput
      );
      return NextResponse.json({ output_markdown: result.text });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // 4. Get workspace.
  // Try with profile columns first, fall back to basic query if columns don't exist yet.
  let workspace: {
    id: string;
    company_name?: string;
    website?: string;
    industry?: string;
    description?: string;
    brand_voice?: string | null;
    use_brand_context?: boolean | null;
  } | null = null;

  // Tiered fallback: newest columns (brand context) → profile columns → id only.
  // This lets the route keep working across migrations that haven't been applied yet.
  const { data: wsWithBrand } = await supabase
    .from("workspaces")
    .select("id, company_name, website, industry, description, brand_voice, use_brand_context")
    .eq("owner_user_id", user.id)
    .single();

  if (wsWithBrand) {
    workspace = wsWithBrand;
  } else {
    const { data: wsProfile } = await supabase
      .from("workspaces")
      .select("id, company_name, website, industry, description")
      .eq("owner_user_id", user.id)
      .single();

    if (wsProfile) {
      workspace = wsProfile;
    } else {
      const { data: wsBasic } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_user_id", user.id)
        .single();
      if (wsBasic) workspace = wsBasic;
    }
  }

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // 5. Parallel reads: workspace context + subscription.
  //    Both depend only on workspace.id and are independent of each other,
  //    so fetch them concurrently to shave one sequential roundtrip.
  const [ctxRes, subRes] = await Promise.all([
    supabase
      .from("workspace_context")
      .select("main_goal, business_type, offer, target_audience, tone, brand_notes")
      .eq("workspace_id", workspace.id)
      .single(),
    supabase
      .from("subscriptions")
      .select("plan_key")
      .eq("workspace_id", workspace.id)
      .single(),
  ]);
  const ctxRow = ctxRes.data;
  const subscription = subRes.data;

  const context = {
    ...(ctxRow ?? {}),
    company_name: workspace.company_name,
    industry: workspace.industry,
    description: workspace.description,
    website: workspace.website,
    brand_voice: workspace.brand_voice,
    // Default to true when the column doesn't exist yet (pre-migration workspaces)
    // or when the value is null — opt-in-by-default matches the DB default.
    use_brand_context: workspace.use_brand_context ?? true,
  };

  // 6. Usage gate — each run costs CREDITS_PER_RUN credits. Compare total
  //    credits consumed (runs × CREDITS_PER_RUN) against the plan cap.
  //    Block when remaining credits are less than one run's cost.
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

      const creditsUsed = (count ?? 0) * CREDITS_PER_RUN;
      const remaining = plan.run_cap - creditsUsed;

      if (remaining < CREDITS_PER_RUN) {
        return NextResponse.json(
          { error: "Credit limit reached. Please upgrade your plan." },
          { status: 403 }
        );
      }
    }
  }

  // 7. Fire the run INSERT in parallel with the Claude call.
  //    Neither the stream open nor the first token require run.id, so we
  //    kick off the INSERT first and recover it when we need it for the
  //    post-stream writes.
  const insertRunPromise = admin
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
      model_name: CLAUDE_MODEL,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  // 8. Dispatch the workflow. Each runX function now returns a
  //    MessageStream synchronously (the underlying HTTP request to Claude
  //    is initiated during construction), so dispatch is sync and we can
  //    start the stream immediately. The "unknown workflow" path throws
  //    synchronously — that gets caught below and returned as a JSON 400.
  let anthropicStream;
  let outputTitle: string;
  try {
    if (module_key === "marketing" && workflow_key === "social_posts") {
      anthropicStream = runSocialPosts(context, input_json as unknown as SocialPostsInput);
      outputTitle = `Social posts — ${input_json.platform}`;
    } else if (module_key === "marketing" && workflow_key === "ad_copy") {
      anthropicStream = runAdCopy(context, input_json as unknown as AdCopyInput);
      outputTitle = `Ad copy — ${input_json.platform}`;
    } else if (module_key === "marketing" && workflow_key === "landing_page") {
      anthropicStream = runLandingPage(context, input_json as unknown as LandingPageInput);
      outputTitle = `Landing page — ${input_json.section}`;
    } else if (module_key === "marketing" && workflow_key === "email_campaign") {
      anthropicStream = runEmailCampaign(context, input_json as unknown as EmailCampaignInput);
      outputTitle = `Email — ${input_json.email_type}`;
    } else if (module_key === "marketing" && workflow_key === "content_brief") {
      anthropicStream = runContentBrief(context, input_json as unknown as ContentBriefInput);
      outputTitle = `Content brief — ${input_json.content_type}`;
    } else if (module_key === "outreach" && workflow_key === "cold_email") {
      anthropicStream = runColdEmail(context, input_json as unknown as ColdEmailInput);
      outputTitle = `Cold email — ${input_json.prospect_company}`;
    } else if (module_key === "outreach" && workflow_key === "follow_up") {
      anthropicStream = runFollowUp(context, input_json as unknown as FollowUpInput);
      outputTitle = `Follow-up — ${input_json.days_since}`;
    } else if (module_key === "outreach" && workflow_key === "proposal") {
      anthropicStream = runProposal(context, input_json as unknown as ProposalInput);
      outputTitle = `Proposal — ${input_json.client_name}`;
    } else if (module_key === "outreach" && workflow_key === "discovery_prep") {
      anthropicStream = runDiscoveryPrep(context, input_json as unknown as DiscoveryPrepInput);
      outputTitle = `Discovery prep — ${input_json.prospect_company}`;
    } else if (module_key === "operations" && workflow_key === "sop_generator") {
      anthropicStream = runSopGenerator(context, input_json as unknown as SopGeneratorInput);
      outputTitle = `SOP — ${input_json.process_name}`;
    } else if (module_key === "operations" && workflow_key === "weekly_plan") {
      anthropicStream = runWeeklyPlan(context, input_json as unknown as WeeklyPlanInput);
      outputTitle = `Weekly plan — ${input_json.focus_area}`;
    } else if (module_key === "operations" && workflow_key === "onboarding_doc") {
      anthropicStream = runOnboardingDoc(context, input_json as unknown as OnboardingDocInput);
      outputTitle = `Onboarding — ${input_json.client_name}`;
    } else if (module_key === "operations" && workflow_key === "process_notes") {
      anthropicStream = runProcessNotes(context, input_json as unknown as ProcessNotesInput);
      outputTitle = `Process notes — ${input_json.process_title}`;
    } else {
      throw new Error(`Unknown workflow: ${module_key}/${workflow_key}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // 9. Build the ReadableStream that pipes Claude text deltas straight to
  //    the client. Once the Claude stream ends, we await the in-flight
  //    run INSERT, then do the output INSERT and runs UPDATE in parallel
  //    before closing the response stream. Closing the stream *after* the
  //    DB writes is important: the frontend fires a `recents:refresh`
  //    event on close, and we want the new row visible by then.
  const encoder = new TextEncoder();
  const responseStream = new ReadableStream<Uint8Array>({
    start(controller) {
      let fullText = "";

      // Register the text listener synchronously — no deltas can have
      // fired yet because we're still on the current tick.
      anthropicStream.on("text", (delta) => {
        fullText += delta;
        try {
          controller.enqueue(encoder.encode(delta));
        } catch {
          // Controller already closed (client aborted). Ignore and let
          // finalMessage() resolve so we can still persist what we have.
        }
      });

      // Drive the stream to completion and persist the result. This is
      // an IIFE because start() itself must return synchronously for
      // the stream to begin emitting.
      (async () => {
        try {
          const final = await anthropicStream.finalMessage();
          const promptTokens = final.usage.input_tokens;
          const completionTokens = final.usage.output_tokens;

          const insertResult = await insertRunPromise;
          if (insertResult.error || !insertResult.data) {
            throw new Error(
              `Failed to create run record: ${insertResult.error?.message ?? "unknown"}`
            );
          }
          const run = insertResult.data;

          await Promise.all([
            admin.from("outputs").insert({
              run_id: run.id,
              title: outputTitle,
              output_markdown: fullText,
            }),
            admin
              .from("runs")
              .update({
                status: "completed",
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                completed_at: new Date().toISOString(),
              })
              .eq("id", run.id),
          ]);
        } catch (err) {
          console.error("[api/runs stream error]", err);
          const message = err instanceof Error ? err.message : "Unknown error";
          try {
            const insertResult = await insertRunPromise;
            if (insertResult?.data?.id) {
              await admin
                .from("runs")
                .update({
                  status: "failed",
                  error_message: message,
                  completed_at: new Date().toISOString(),
                })
                .eq("id", insertResult.data.id);
            }
          } catch {
            // Best-effort — the stream is already closing.
          }
        } finally {
          try {
            controller.close();
          } catch {
            // Already closed by a prior error path.
          }
        }
      })();
    },

    cancel() {
      // Client disconnected before the stream finished. Abort the Claude
      // request so we don't keep generating tokens into the void.
      anthropicStream.abort();
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      // Disable proxy buffering (nginx / Vercel) so tokens arrive live.
      "X-Accel-Buffering": "no",
    },
  });
}
