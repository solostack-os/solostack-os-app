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
}

export function buildContextPacket(ctx: WorkspaceContext): string {
  const parts: string[] = [];

  if (ctx.company_name) parts.push(`Company: ${ctx.company_name}.`);
  if (ctx.industry) parts.push(`Industry: ${ctx.industry}.`);
  if (ctx.description) parts.push(`Description: ${ctx.description}.`);
  if (ctx.website) parts.push(`Website: ${ctx.website}.`);
  if (ctx.business_type) parts.push(`Business: ${ctx.business_type}.`);
  if (ctx.offer) parts.push(`Offer: ${ctx.offer}.`);
  if (ctx.target_audience) parts.push(`Audience: ${ctx.target_audience}.`);
  if (ctx.tone) parts.push(`Tone: ${ctx.tone}.`);
  if (ctx.main_goal) parts.push(`Primary goal: ${ctx.main_goal}.`);
  if (ctx.brand_notes) parts.push(`Brand notes: ${ctx.brand_notes}.`);

  return parts.join(" ");
}
