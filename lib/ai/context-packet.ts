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
 * Build the brand-context prefix that gets prepended to every AI system prompt.
 *
 * - When `use_brand_context` is explicitly false, returns an empty string so the
 *   workflow falls back to a generic prompt with no brand injection.
 * - Otherwise returns a single sentence describing who the AI is writing for,
 *   using whichever profile fields are populated. Missing fields are skipped
 *   gracefully so a partially-filled profile still produces a clean sentence.
 * - If `preferred_language` is set, appends a language instruction at the end.
 *   This is overridden naturally when the user writes their input in a different
 *   language — the model will follow the input language instead.
 *
 * Callers should treat an empty return value as "no brand context" and avoid
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

  // If the user hasn't filled in anything meaningful, only inject language if set.
  if (!company && !industry && !description && !voice) {
    if (lang) {
      return `IMPORTANT: Always respond in ${lang}, unless the user's input is clearly written in a different language — in that case, match the user's language instead.`;
    }
    return "";
  }

  const subject =
    company && industry
      ? `${company}, a ${industry} business`
      : company
      ? company
      : industry
      ? `a ${industry} business`
      : "this business";

  const parts: string[] = [`You are writing for ${subject}.`];
  if (description) parts.push(`About the business: ${description}.`);
  if (voice) parts.push(`Brand voice: ${voice}.`);
  parts.push("Write in this brand's voice and style.");

  if (lang) {
    parts.push(`IMPORTANT: Always respond in ${lang}, unless the user's input is clearly written in a different language — in that case, match the user's language instead.`);
  }

  return parts.join(" ");
}
