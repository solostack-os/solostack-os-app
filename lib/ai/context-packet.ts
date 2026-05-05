export interface WorkspaceContext {
  main_goal?: string | null;
  business_type?: string | null;
  offer?: string | null;
  target_audience?: string | null;
  tone?: string | null;
  brand_notes?: string | null;
  company_name?: string | null;
  industry?: string | null;
  description?: string | null;
  website?: string | null;
  brand_voice?: string | null;
  use_brand_context?: boolean | null;
  preferred_language?: string | null;
  copy_good_examples?: string | null;
  copy_bad_examples?: string | null;
}

/**
 * Returns today's date as YYYY-MM-DD (server local time).
 * Inject into every workflow user prompt to prevent the model from using
 * stale training-data years (e.g. writing "2025" when it's 2026).
 */
export function currentDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Build the business-context block injected into every AI prompt.
 *
 * - When `use_brand_context` is explicitly false, returns an empty string so the
 *   workflow falls back to a generic prompt with no context injection.
 * - Otherwise returns a structured block that includes both identity/voice fields
 *   AND substantive business fields (audience, offer, positioning, etc.).
 *   The model is instructed to treat these as MANDATORY source material that MUST
 *   appear in the output — not just as tone/style hints.
 * - Missing fields are skipped gracefully so a partially-filled profile still
 *   produces a clean block.
 * - If `preferred_language` is set, appends a language instruction at the end.
 *
 * Callers should treat an empty return value as "no business context" and avoid
 * rendering any surrounding labels around it.
 */
export function buildContextPacket(ctx: WorkspaceContext): string {
  if (ctx.use_brand_context === false) {
    // Even without brand context, respect preferred language if set.
    const lang = ctx.preferred_language?.trim();
    if (lang) {
      return `IMPORTANT: Always respond in ${lang}, unless the user's input is clearly written in a different language — in that case, match the user's language instead.`;
    }
    return "";
  }

  const company = ctx.company_name?.trim();
  const industry = ctx.industry?.trim();
  const description = ctx.description?.trim();
  const voice = ctx.brand_voice?.trim();
  const lang = ctx.preferred_language?.trim();
  const audience = ctx.target_audience?.trim();
  const offer = ctx.offer?.trim();
  const businessType = ctx.business_type?.trim();
  const mainGoal = ctx.main_goal?.trim();
  const tone = ctx.tone?.trim();
  const brandNotes = ctx.brand_notes?.trim();
  const badExamples = ctx.copy_bad_examples?.trim();

  // If the user hasn't filled in anything meaningful, only inject language if set.
  if (
    !company && !industry && !description && !voice &&
    !audience && !offer && !businessType && !mainGoal && !tone && !brandNotes
  ) {
    if (lang) {
      return `IMPORTANT: Always respond in ${lang}, unless the user's input is clearly written in a different language — in that case, match the user's language instead.`;
    }
    return "";
  }

  const parts: string[] = [];

  // ── Hard directive ──
  parts.push("## BUSINESS CONTEXT — SUBSTANTIVE SOURCE MATERIAL");
  parts.push("");
  parts.push("The following is NOT just tone guidance. It is the factual context of the business you are writing for. You MUST use this information materially in the output — in your examples, arguments, specificity, recommendations, and framing.");
  parts.push("");

  // ── Identity ──
  const subject =
    company && industry
      ? `${company}, a ${industry} business`
      : company
      ? company
      : industry
      ? `a ${industry} business`
      : "this business";
  parts.push(`Business: ${subject}`);

  // ── Substantive fields (the model MUST draw from these) ──
  if (description) parts.push(`What they do: ${description}`);
  if (offer) parts.push(`Offer: ${offer}`);
  if (businessType) parts.push(`Business type: ${businessType}`);
  if (audience) parts.push(`Target audience: ${audience}`);
  if (mainGoal) parts.push(`Main goal: ${mainGoal}`);
  if (brandNotes) parts.push(`Positioning & point of view: ${brandNotes}`);

  // ── Voice / tone (stylistic layer — secondary to substance) ──
  if (voice) parts.push(`Brand voice: ${voice}`);
  if (tone) parts.push(`Tone: ${tone}`);

  // ── Anti-patterns from copy calibration ──
  if (badExamples) {
    parts.push("");
    parts.push(`COPY TO AVOID — actively steer away from these patterns, vocabulary, and structures:\n${badExamples}`);
  }

  // ── Mandatory usage rules ──
  parts.push("");
  parts.push("## HOW TO USE THIS CONTEXT");
  parts.push("");
  parts.push("When Business Context is present, every output must use it materially:");
  parts.push("- Reference the target audience concretely. Name who this is for.");
  parts.push("- Ground examples and arguments in the actual offer, product category, or service.");
  parts.push("- Write from this business's point of view and positioning — not from a generic expert voice.");
  parts.push("- If the user's topic is broad or generic, anchor it in the saved business context by default.");
  parts.push("- When the topic overlaps with the product's core mechanism, reference that mechanism as the practical answer.");
  parts.push("- The reader should be able to tell which business wrote this. If a competitor could publish the same output unchanged, you have failed.");
  parts.push("");
  parts.push("Do NOT write generic educational content when saved context can make it specific.");
  parts.push("Do NOT force the company name into every sentence — use it only where natural.");
  parts.push("Do NOT make the output sound like an ad or pitch unless the workflow explicitly requires it (e.g., ad copy).");

  if (lang) {
    parts.push(`\nIMPORTANT: Always respond in ${lang}, unless the user's input is clearly written in a different language — in that case, match the user's language instead.`);
  }

  return parts.join("\n");
}
