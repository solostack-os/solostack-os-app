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
 *   The model is instructed to treat these as source material — shaping examples,
 *   arguments, angles, and specificity — not just tone.
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

  // ── Guiding principle ──
  parts.push("A topic gives direction. The saved Business Context gives judgment. If Business Context exists, use it to make the output specific to this business — not just in tone, but in substance: examples, arguments, angles, specificity, and recommendations.");
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
  parts.push(`Business: ${subject}.`);

  // ── Substantive fields ──
  if (description) parts.push(`What they do: ${description}`);
  if (offer) parts.push(`Offer: ${offer}`);
  if (businessType) parts.push(`Business type: ${businessType}`);
  if (audience) parts.push(`Target audience: ${audience}`);
  if (mainGoal) parts.push(`Main goal: ${mainGoal}`);
  if (brandNotes) parts.push(`Positioning & notes: ${brandNotes}`);

  // ── Voice / tone (stylistic layer) ──
  if (voice) parts.push(`Brand voice: ${voice}`);
  if (tone) parts.push(`Tone: ${tone}`);

  // ── Usage instruction ──
  parts.push("");
  parts.push("Use these details as source material. Anchor examples, arguments, and specificity in this business context. When the topic directly overlaps with the product's core mechanism or operating principle, naturally reference that mechanism as the practical answer — write from this business's point of view, not just in its tone. Do not force the company name into every output — use it only when natural. Do not make the output sound like an ad unless the workflow requires it.");

  if (lang) {
    parts.push(`\nIMPORTANT: Always respond in ${lang}, unless the user's input is clearly written in a different language — in that case, match the user's language instead.`);
  }

  return parts.join("\n");
}
