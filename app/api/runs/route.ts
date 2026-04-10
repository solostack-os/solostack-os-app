import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { CLAUDE_MODEL, callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";
import { OPENAI_MODEL, callOpenAIStream } from "@/lib/ai/providers/openai";
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
      .select("plan_key, current_period_start, extra_credits")
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

  // 6. Usage gate — each run costs CREDITS_PER_RUN credits. Compare credits
  //    consumed within the current billing period against the plan cap.
  //    Trial subscriptions count all runs (no monthly reset).
  //    Paid plans count only runs since current_period_start (no rollover —
  //    each new period the counter resets to zero).
  if (subscription) {
    const { data: plan } = await admin
      .from("plans")
      .select("run_cap")
      .eq("key", subscription.plan_key)
      .single();

    if (plan?.run_cap !== null && plan?.run_cap !== undefined) {
      const isTrial = subscription.plan_key === "trial";
      const periodStart = !isTrial ? subscription.current_period_start : null;

      let runsQuery = admin
        .from("runs")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id);

      // For paid plans, only count runs within the current billing period.
      if (periodStart) {
        runsQuery = runsQuery.gte("created_at", periodStart);
      }

      const { count } = await runsQuery;

      const extraCredits = (subscription as { extra_credits?: number }).extra_credits ?? 0;
      const creditsUsed = (count ?? 0) * CREDITS_PER_RUN;
      const effectiveCap = plan.run_cap + extraCredits;
      const remaining = effectiveCap - creditsUsed;

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
  // Track which provider is active so the completion update reflects any fallback.
  let activeProvider: "anthropic" | "openai" = "anthropic";
  let activeModel: string = CLAUDE_MODEL;

  // Fire the run INSERT immediately (before stream starts) for performance.
  // model_provider starts as "anthropic"; if we fall back to OpenAI, the
  // completion update below will correct it.
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
      model_provider: activeProvider,
      model_name: activeModel,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  // 8. Dispatch helper — creates a fresh stream for the requested workflow.
  //    Accepts an optional streamFn to swap the underlying AI provider
  //    (e.g. callOpenAIStream when Anthropic is overloaded).
  //    Throws synchronously for unknown workflows (caught below → 400).
  let outputTitle: string;
  function createStream(streamFn: StreamFn = callClaudeStream) {
    if (module_key === "marketing" && workflow_key === "social_posts") {
      outputTitle = `Social posts — ${input_json.platform}`;
      return runSocialPosts(context, input_json as unknown as SocialPostsInput, streamFn);
    } else if (module_key === "marketing" && workflow_key === "ad_copy") {
      outputTitle = `Ad copy — ${input_json.platform}`;
      return runAdCopy(context, input_json as unknown as AdCopyInput, streamFn);
    } else if (module_key === "marketing" && workflow_key === "landing_page") {
      outputTitle = `Landing page — ${input_json.section}`;
      return runLandingPage(context, input_json as unknown as LandingPageInput, streamFn);
    } else if (module_key === "marketing" && workflow_key === "email_campaign") {
      outputTitle = `Email — ${input_json.email_type}`;
      return runEmailCampaign(context, input_json as unknown as EmailCampaignInput, streamFn);
    } else if (module_key === "marketing" && workflow_key === "content_brief") {
      outputTitle = `Content brief — ${input_json.content_type}`;
      return runContentBrief(context, input_json as unknown as ContentBriefInput, streamFn);
    } else if (module_key === "outreach" && workflow_key === "cold_email") {
      outputTitle = `Cold email — ${input_json.prospect_company}`;
      return runColdEmail(context, input_json as unknown as ColdEmailInput, streamFn);
    } else if (module_key === "outreach" && workflow_key === "follow_up") {
      outputTitle = `Follow-up — ${input_json.days_since}`;
      return runFollowUp(context, input_json as unknown as FollowUpInput, streamFn);
    } else if (module_key === "outreach" && workflow_key === "proposal") {
      outputTitle = `Proposal — ${input_json.client_name}`;
      return runProposal(context, input_json as unknown as ProposalInput, streamFn);
    } else if (module_key === "outreach" && workflow_key === "discovery_prep") {
      outputTitle = `Discovery prep — ${input_json.prospect_company}`;
      return runDiscoveryPrep(context, input_json as unknown as DiscoveryPrepInput, streamFn);
    } else if (module_key === "operations" && workflow_key === "sop_generator") {
      outputTitle = `SOP — ${input_json.process_name}`;
      return runSopGenerator(context, input_json as unknown as SopGeneratorInput, streamFn);
    } else if (module_key === "operations" && workflow_key === "weekly_plan") {
      outputTitle = `Weekly plan — ${input_json.focus_area}`;
      return runWeeklyPlan(context, input_json as unknown as WeeklyPlanInput, streamFn);
    } else if (module_key === "operations" && workflow_key === "onboarding_doc") {
      outputTitle = `Onboarding — ${input_json.client_name}`;
      return runOnboardingDoc(context, input_json as unknown as OnboardingDocInput, streamFn);
    } else if (module_key === "operations" && workflow_key === "process_notes") {
      outputTitle = `Process notes — ${input_json.process_title}`;
      return runProcessNotes(context, input_json as unknown as ProcessNotesInput, streamFn);
    } else {
      throw new Error(`Unknown workflow: ${module_key}/${workflow_key}`);
    }
  }

  // Validate workflow key before opening the response stream.
  let currentStream: ReturnType<typeof createStream>;
  try {
    currentStream = createStream();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // 9. Build the ReadableStream that pipes AI text deltas straight to the
  //    client. Strategy:
  //      1. Try Anthropic (claude-sonnet-4-6) — up to MAX_RETRIES with
  //         exponential backoff on overloaded_error.
  //      2. If still overloaded after MAX_RETRIES, automatically fall back
  //         to OpenAI (gpt-4o) for this request.
  //      3. Any other error → mark run as failed and surface to the client.
  //    Once the stream ends, we await the in-flight run INSERT, then do the
  //    output INSERT and run UPDATE in parallel before closing the response
  //    stream. Closing *after* the DB writes ensures the frontend's
  //    `recents:refresh` event sees the new row immediately.
  const MAX_RETRIES = 2;
  const encoder = new TextEncoder();
  const responseStream = new ReadableStream<Uint8Array>({
    start(controller) {
      let fullText = "";
      let retryCount = 0;

      // Attach text listener to a stream instance and drive it to completion.
      // Throws on unrecoverable errors; auto-retries on overloaded_error up to
      // MAX_RETRIES, then transparently switches to OpenAI.
      async function driveStream(stream: ReturnType<typeof createStream>): Promise<void> {
        let gotTokens = false;

        stream.on("text", (delta: string) => {
          gotTokens = true;
          fullText += delta;
          try {
            controller.enqueue(encoder.encode(delta));
          } catch {
            // Controller already closed (client aborted).
          }
        });

        try {
          const final = await stream.finalMessage();
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
                // Correct the model fields if an OpenAI fallback was used.
                model_provider: activeProvider,
                model_name: activeModel,
              })
              .eq("id", run.id),
          ]);
        } catch (err) {
          const errType = (err as { type?: string })?.type;
          const isOverloaded = !gotTokens && errType === "overloaded_error";

          // ── Anthropic retry with backoff ──────────────────────────────
          if (isOverloaded && retryCount < MAX_RETRIES) {
            retryCount++;
            const delayMs = retryCount * 2000; // 2 s, 4 s
            console.warn(
              `[api/runs] Anthropic overloaded — retry ${retryCount}/${MAX_RETRIES} in ${delayMs}ms`
            );
            await new Promise((r) => setTimeout(r, delayMs));
            currentStream = createStream(); // callClaudeStream (default)
            return driveStream(currentStream);
          }

          // ── OpenAI fallback after MAX_RETRIES ─────────────────────────
          if (isOverloaded && retryCount >= MAX_RETRIES && process.env.OPENAI_API_KEY) {
            console.warn(
              `[api/runs] Anthropic overloaded after ${MAX_RETRIES} retries — falling back to OpenAI`
            );
            activeProvider = "openai";
            activeModel = OPENAI_MODEL;
            currentStream = createStream(callOpenAIStream);
            return driveStream(currentStream);
          }

          // ── Unrecoverable — log and mark run as failed ────────────────
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
            // Best-effort.
          }
        }
      }

      // Kick off the drive loop, then always close the controller.
      (async () => {
        try {
          await driveStream(currentStream);
        } finally {
          try {
            controller.close();
          } catch {
            // Already closed.
          }
        }
      })();
    },

    cancel() {
      // Client disconnected — abort the current Claude request.
      currentStream.abort();
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
