/**
 * Number of credits deducted per successful workflow run.
 * Bump this when switching to a more expensive model.
 *
 * Sonnet ($3/$15 per 1M tokens) is ~3x Haiku ($1/$5 per 1M tokens).
 */
export const CREDITS_PER_RUN = 3;

/**
 * Workflow keys that generate multiple independent outputs in a single run
 * (e.g. 3 social posts, several ad variants). Their output is split by the
 * \n---\n separator and rendered as individual cards.
 *
 * Everything else (scripts, briefs, emails, SOPs, etc.) is a single document
 * and should be shown as one unbroken card.
 */
export const MULTI_OUTPUT_WORKFLOWS = new Set([
  "social_posts",
  "ad_copy",
]);
