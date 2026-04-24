import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sanitizeCopyExamples } from "@/lib/utils/copy-safety";
import { buildContextPacket } from "@/lib/ai/context-packet";

/**
 * POST /api/sparkle
 *
 * Ad Copy Calibration — Phase 2 Sparkle Assistant.
 * Pro-only feature. Uses claude-haiku for cost control.
 *
 * Input:
 *   { brand_type: string, tones: string[], avoid_text?: string, workspace_id?: string }
 *
 * Output (JSON):
 *   {
 *     admire: [{ example: string, note: string }, ...],   // 3 examples
 *     avoid:  [{ example: string, note: string }, ...]    // 2 examples
 *   }
 *
 * Rate limit: 15 uses per 24h rolling window (Pro plan).
 * The input is hashed for optional future cache lookup.
 */

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const RATE_LIMIT_PRO = 15;

// Plans that are allowed to access sparkle at all.
const ALLOWED_PLANS = ["pro"];

function buildSystemPrompt(brandContext: string, preferredLanguage: string | null): string {
  const brandSection = brandContext
    ? `\nBRAND CONTEXT (use this to calibrate examples to this specific brand):\n${brandContext}\nGenerate examples calibrated to THIS specific brand, not generic industry patterns. The examples should feel like they were written for this company's positioning and voice.\n`
    : "";

  const languageInstruction = preferredLanguage
    ? `\nLANGUAGE: Generate all examples in ${preferredLanguage}.\n`
    : "";

  return `You are a copywriting calibration assistant. Your job is to generate original example copy that helps users understand their brand's tone and what to avoid.

CRITICAL — Legal safety:
Do not quote, paraphrase, or closely imitate copy from real brands or real campaigns. Do not mention real brand names in the generated examples. If the user references a specific brand, use it only as a tone direction — generate original copy that captures the same register. Never reproduce or closely mirror any brand's actual copy. Generate original copy that demonstrates the style, not that replicates any existing work.
${brandSection}${languageInstruction}
Output format:
Return ONLY valid JSON, no markdown, no prose. The JSON must exactly follow this structure:
{
  "admire": [
    { "example": "...", "note": "..." },
    { "example": "...", "note": "..." },
    { "example": "...", "note": "..." }
  ],
  "avoid": [
    { "example": "...", "note": "..." },
    { "example": "...", "note": "..." }
  ]
}

Constraints:
- admire: exactly 3 examples. Each "example" is a headline + 1-2 sentences body, max 15 words total. Each "note" is max 10 words, explaining what makes it work.
- avoid: exactly 2 examples. These should be generic buzzword-heavy copy patterns — not attributed to any real brand. Each "note" should name the specific anti-pattern.
- admire examples must feel specific, confident, and original. Not generic. Calibrated to the user's described industry and tone.
- avoid examples must contain the kind of language that would actually appear in bad copy for the described category.`;
}

function buildUserPrompt(brandType: string, tones: string[], avoidText?: string): string {
  const toneList = tones.join(", ");
  const avoidLine = avoidText?.trim()
    ? `\nThings to avoid: ${avoidText.trim()}`
    : "";

  return `Brand type / industry: ${brandType}
Desired tone(s): ${toneList}${avoidLine}

Generate 3 original "Copy I admire" examples and 2 original "Copy I avoid" examples calibrated for this brand profile. Return valid JSON only.`;
}

/** Normalize and hash the input for optional cache key. */
async function hashInput(brandType: string, tones: string[], avoidText?: string): Promise<string> {
  const normalized = JSON.stringify({
    b: brandType.toLowerCase().trim(),
    t: [...tones].sort(),
    a: (avoidText ?? "").toLowerCase().trim(),
  });
  const msgBuffer = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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

  // 2. Parse & validate body
  let body: { brand_type?: string; tones?: string[]; avoid_text?: string; workspace_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { brand_type, tones, avoid_text } = body;

  if (!brand_type?.trim()) {
    return NextResponse.json({ error: "brand_type is required" }, { status: 400 });
  }
  if (!Array.isArray(tones) || tones.length === 0) {
    return NextResponse.json({ error: "tones must be a non-empty array" }, { status: 400 });
  }

  // Enforce input length limits
  const sanitizedBrandType = brand_type.trim().slice(0, 100);
  const sanitizedTones = tones.slice(0, 8);
  const sanitizedAvoidText = (avoid_text ?? "").trim().slice(0, 150);

  // Run through copy sanitizer to strip injection patterns
  const sanitizedInput = sanitizeCopyExamples(
    `${sanitizedBrandType} ${sanitizedTones.join(" ")} ${sanitizedAvoidText}`
  );
  if (!sanitizedInput) {
    return NextResponse.json({ error: "Invalid input content" }, { status: 400 });
  }

  // 3. Look up workspace and verify Pro plan + fetch brand context
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, company_name, industry, description, brand_voice, use_brand_context, preferred_language")
    .eq("owner_user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_key")
    .eq("workspace_id", workspace.id)
    .single();

  if (!ALLOWED_PLANS.includes(subscription?.plan_key ?? "")) {
    return NextResponse.json(
      { error: "Sparkle Assistant is a Pro feature. Upgrade to unlock." },
      { status: 403 }
    );
  }

  // 4. Rate limit — 24h rolling window
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: usageCount } = await supabase
    .from("sparkle_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("used_at", windowStart);

  const used = usageCount ?? 0;
  const limit = RATE_LIMIT_PRO;

  if (used >= limit) {
    // Calculate reset time: find the oldest usage row in the window
    const { data: oldestRow } = await supabase
      .from("sparkle_usage")
      .select("used_at")
      .eq("user_id", user.id)
      .gte("used_at", windowStart)
      .order("used_at", { ascending: true })
      .limit(1)
      .single();

    const resetsAt = oldestRow
      ? new Date(new Date(oldestRow.used_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
      : null;

    return NextResponse.json(
      {
        error: `You've used ${used}/${limit} sparkle assists today.`,
        resets_at: resetsAt,
        used,
        limit,
      },
      { status: 429 }
    );
  }

  // 5. Build brand context from workspace profile
  let brandContext = "";
  let preferredLanguage: string | null = null;

  if (workspace) {
    const useBrand = (workspace as { use_brand_context?: boolean | null }).use_brand_context ?? true;
    preferredLanguage = (workspace as { preferred_language?: string | null }).preferred_language?.trim() || null;

    if (useBrand) {
      brandContext = buildContextPacket({
        company_name: workspace.company_name,
        industry: workspace.industry,
        description: workspace.description,
        brand_voice: workspace.brand_voice,
        use_brand_context: true,
      });
    }
  }

  const systemPrompt = buildSystemPrompt(brandContext, preferredLanguage);

  // 6. Call Haiku
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const userPrompt = buildUserPrompt(sanitizedBrandType, sanitizedTones, sanitizedAvoidText);

  let raw: string;
  try {
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (err) {
    console.error("[api/sparkle] Haiku call failed:", err);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 502 }
    );
  }

  // 7. Parse and validate JSON output
  let parsed: {
    admire: { example: string; note: string }[];
    avoid: { example: string; note: string }[];
  };

  try {
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    parsed = JSON.parse(cleaned);

    if (
      !Array.isArray(parsed.admire) ||
      !Array.isArray(parsed.avoid) ||
      parsed.admire.length === 0 ||
      parsed.avoid.length === 0
    ) {
      throw new Error("Unexpected JSON shape");
    }
  } catch (err) {
    console.error("[api/sparkle] JSON parse failed:", err, "\nRaw:", raw);
    return NextResponse.json(
      { error: "Generation returned unexpected format. Please try again." },
      { status: 502 }
    );
  }

  // Enforce max counts from spec
  parsed.admire = parsed.admire.slice(0, 3);
  parsed.avoid = parsed.avoid.slice(0, 2);

  // 8. Log usage (fire-and-forget — don't block response on this)
  const inputHash = await hashInput(sanitizedBrandType, sanitizedTones, sanitizedAvoidText);
  supabase
    .from("sparkle_usage")
    .insert({ user_id: user.id, input_hash: inputHash })
    .then(({ error }) => {
      if (error) console.error("[api/sparkle] Usage log failed:", error);
    });

  // 9. Return result with remaining quota
  return NextResponse.json({
    ...parsed,
    _meta: {
      used: used + 1,
      limit,
      remaining: limit - used - 1,
    },
  });
}
