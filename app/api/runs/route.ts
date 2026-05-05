import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { CLAUDE_MODEL, callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";
import { OPENAI_MODEL, callOpenAIStream } from "@/lib/ai/providers/openai";
import { callOpenAIStreamWithCopyAdapter } from "@/lib/ai/gpt4o-adapter";
import { CREDITS_PER_RUN } from "@/lib/constants";
import { sanitizeCopyExamples } from "@/lib/utils/copy-safety";
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
import { runVoScript, type VoScriptInput } from "@/lib/workflows/marketing/vo-script";

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

  // 2b. Enforce brief/topic length limit (backend safety net for client-side enforcement).
  const topic = (input_json?.topic as string) ?? "";
  if (topic.length > 2600) {
    return NextResponse.json({ error: "Brief exceeds maximum length" }, { status: 400 });
  }

  // 3. Topic suggestions — bypass usage gate (no credits charged) but DO fetch
  //    workspace context so we can personalise suggestions when use_brand_context
  //    is enabled, and respect the user's preferred language setting.
  if (module_key === "marketing" && workflow_key === "topic_suggestions") {
    try {
      let brandContext: string | null = null;
      let preferredLanguage: string | null = null;

      // Best-effort workspace + context fetch — if it fails, suggestions remain generic.
      const { data: wsForSuggest } = await supabase
        .from("workspaces")
        .select("id, company_name, industry, description, brand_voice, use_brand_context, preferred_language")
        .eq("owner_user_id", user.id)
        .single();

      if (wsForSuggest) {
        preferredLanguage = (wsForSuggest as { preferred_language?: string | null }).preferred_language ?? null;

        const useBrand = (wsForSuggest as { use_brand_context?: boolean | null }).use_brand_context ?? true;
        if (useBrand) {
          // Fetch workspace_context so topic suggestions get substantive fields too.
          const { data: ctxForSuggest } = await supabase
            .from("workspace_context")
            .select("main_goal, business_type, offer, target_audience, tone, brand_notes")
            .eq("workspace_id", wsForSuggest.id)
            .single();

          const { buildContextPacket } = await import("@/lib/ai/context-packet");
          brandContext = buildContextPacket({
            ...(ctxForSuggest ?? {}),
            company_name: wsForSuggest.company_name,
            industry: wsForSuggest.industry,
            description: wsForSuggest.description,
            brand_voice: wsForSuggest.brand_voice,
            use_brand_context: true,
            preferred_language: preferredLanguage,
          }) || null;
        } else if (preferredLanguage) {
          // Language-only — no brand context but still respect language preference.
          brandContext = null;
        }
      }

      const result = await runTopicSuggestions({
        ...(input_json as unknown as TopicSuggestionsInput),
        brand_context: brandContext,
        preferred_language: preferredLanguage,
      });
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
    preferred_language?: string | null;
    copy_good_examples?: string | null;
    copy_bad_examples?: string | null;
  } | null = null;

  // Tiered fallback: newest columns (brand context) → profile columns → id only.
  // This lets the route keep working across migrations that haven't been applied yet.
  const { data: wsWithBrand } = await supabase
    .from("workspaces")
    .select("id, company_name, website, industry, description, brand_voice, use_brand_context, preferred_language, copy_good_examples, copy_bad_examples")
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
    preferred_language: workspace.preferred_language ?? null,
    // Copy calibration examples are a Pro feature. They are saved for all plans
    // (so users can prepare content before upgrading) but only injected into
    // generation prompts on Pro. Non-Pro plans pass null to the workflow.
    // sanitizeCopyExamples strips prompt injection patterns and enforces length.
    copy_good_examples: subscription?.plan_key === "pro"
      ? sanitizeCopyExamples(workspace.copy_good_examples)
      : null,
    copy_bad_examples: subscription?.plan_key === "pro"
      ? sanitizeCopyExamples(workspace.copy_bad_examples)
      : null,
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
        .eq("workspace_id", workspace.id)
        .neq("is_sample", true);

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

  // Track first_workflow_run (one-time, non-blocking — unique index handles dedup)
  void admin
    .from("user_events")
    .upsert(
      { user_id: user.id, event_name: "first_workflow_run", event_data: { module_key, workflow_key } },
      { onConflict: "user_id,event_name", ignoreDuplicates: true }
    )
    .then(() => {}, () => {});

  // 8. Dispatch helper — creates a fresh stream for the requested workflow.
  //    Accepts an optional streamFn to swap the underlying AI provider
  //    (e.g. callOpenAIStream when Anthropic is overloaded).
  //    Throws synchronously for unknown workflows (caught below → 400).
  // Workflows that use the full creative copywriting system (craft principles,
  // voice registers, multi-variant format). These get the GPT-4o adapter on
  // fallback so output quality stays above the acceptable floor.
  const COPY_WORKFLOWS = new Set(["social_posts", "ad_copy"]);

  let outputTitle: string;
  function createStream(streamFn: StreamFn = callClaudeStream) {
    // When routing through OpenAI, copy workflows need the adapter addendum
    // to counter GPT-4o's biases (banned vocab drift, structural sameness,
    // code-switching, brand-account endings). Non-copy workflows use the
    // plain callOpenAIStream — the adapter rules don't apply to them.
    const resolvedStreamFn =
      streamFn === callOpenAIStream && COPY_WORKFLOWS.has(workflow_key)
        ? callOpenAIStreamWithCopyAdapter
        : streamFn;

    if (module_key === "marketing" && workflow_key === "social_posts") {
      outputTitle = `Social posts — ${input_json.platform}`;
      return runSocialPosts(context, input_json as unknown as SocialPostsInput, resolvedStreamFn);
    } else if (module_key === "marketing" && workflow_key === "ad_copy") {
      outputTitle = `Ad copy — ${input_json.platform}`;
      return runAdCopy(context, input_json as unknown as AdCopyInput, resolvedStreamFn);
    } else if (module_key === "marketing" && workflow_key === "landing_page") {
      outputTitle = `Landing page — ${input_json.section}`;
      return runLandingPage(context, input_json as unknown as LandingPageInput, resolvedStreamFn);
    } else if (module_key === "marketing" && workflow_key === "email_campaign") {
      outputTitle = `Email — ${input_json.email_type}`;
      return runEmailCampaign(context, input_json as unknown as EmailCampaignInput, resolvedStreamFn);
    } else if (module_key === "marketing" && workflow_key === "content_brief") {
      outputTitle = `Content brief — ${input_json.content_type}`;
      return runContentBrief(context, input_json as unknown as ContentBriefInput, resolvedStreamFn);
    } else if (module_key === "outreach" && workflow_key === "cold_email") {
      outputTitle = `Cold email — ${input_json.prospect_company}`;
      return runColdEmail(context, input_json as unknown as ColdEmailInput, resolvedStreamFn);
    } else if (module_key === "outreach" && workflow_key === "follow_up") {
      outputTitle = `Follow-up — ${input_json.days_since}`;
      return runFollowUp(context, input_json as unknown as FollowUpInput, resolvedStreamFn);
    } else if (module_key === "outreach" && workflow_key === "proposal") {
      outputTitle = `Proposal — ${input_json.client_name}`;
      return runProposal(context, input_json as unknown as ProposalInput, resolvedStreamFn);
    } else if (module_key === "outreach" && workflow_key === "discovery_prep") {
      outputTitle = `Discovery prep — ${input_json.prospect_company}`;
      return runDiscoveryPrep(context, input_json as unknown as DiscoveryPrepInput, resolvedStreamFn);
    } else if (module_key === "operations" && workflow_key === "sop_generator") {
      outputTitle = `SOP — ${input_json.process_name}`;
      return runSopGenerator(context, input_json as unknown as SopGeneratorInput, resolvedStreamFn);
    } else if (module_key === "operations" && workflow_key === "weekly_plan") {
      outputTitle = `Weekly plan — ${input_json.focus_area}`;
      return runWeeklyPlan(context, input_json as unknown as WeeklyPlanInput, resolvedStreamFn);
    } else if (module_key === "operations" && workflow_key === "onboarding_doc") {
      outputTitle = `Onboarding — ${input_json.client_name}`;
      return runOnboardingDoc(context, input_json as unknown as OnboardingDocInput, resolvedStreamFn);
    } else if (module_key === "operations" && workflow_key === "process_notes") {
      outputTitle = `Process notes — ${input_json.process_title}`;
      return runProcessNotes(context, input_json as unknown as ProcessNotesInput, resolvedStreamFn);
    } else if (module_key === "marketing" && workflow_key === "vo_script") {
      const voFormatLabels: Record<string, string> = {
        commercial_ad: "Commercial Ad",
        corporate_brand: "Corporate Brand",
        educational_explainer: "Explainer",
        radio_spot: "Radio Spot",
        podcast_intro_outro: "Podcast Intro/Outro",
        presentation: "Presentation",
      };
      outputTitle = `VO script — ${voFormatLabels[input_json.format as string] ?? input_json.format}`;
      return runVoScript(context, input_json as unknown as VoScriptInput, resolvedStreamFn);
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

          // Track first_workflow_run_completed (one-time, non-blocking — unique index handles dedup)
          void admin
            .from("user_events")
            .upsert(
              { user_id: user!.id, event_name: "first_workflow_run_completed", event_data: { module_key, workflow_key } },
              { onConflict: "user_id,event_name", ignoreDuplicates: true }
            )
            .then(() => {}, () => {});

          // Flip has_generated for activation panel (idempotent, non-blocking)
          void admin
            .from("workspaces")
            .update({ has_generated: true })
            .eq("id", workspace!.id)
            .eq("has_generated", false)
            .then(() => {}, () => {});

          // Emit provider metadata as the final stream token so the client
          // can decide whether CD Pass is eligible (anthropic-only, Pro plan).
          // The client strips this token before rendering or saving output.
          const metaToken = `\n__META:${JSON.stringify({ provider: activeProvider })}__`;
          try {
            controller.enqueue(encoder.encode(metaToken));
          } catch {
            // Client already disconnected — safe to ignore.
          }
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
