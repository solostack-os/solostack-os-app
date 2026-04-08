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
}

/**
 * Build the brand-context prefix that gets prepended to every AI system prompt.
 *
 * - When `use_brand_context` is explicitly false, returns an empty string so the
 *   workflow falls back to a generic prompt with no brand injection.
 * - Otherwise returns a single sentence describing who the AI is writing for,
 *   using whichever profile fields are populated. Missing fields are skipped
 *   gracefully so a partially-filled profile still produces a clean sentence.
 *
 * Callers should treat an empty return value as "no brand context" and avoid
 * rendering any surrounding labels around it.
 */
export function buildContextPacket(ctx: WorkspaceContext): string {
  if (ctx.use_brand_context === false) return "";

  const company = ctx.company_name?.trim();
  const industry = ctx.industry?.trim();
  const description = ctx.description?.trim();
  const voice = ctx.brand_voice?.trim();

  // If the user hasn't filled in anything meaningful, skip the prefix entirely.
  if (!company && !industry && !description && !voice) return "";

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

  return parts.join(" ");
}
