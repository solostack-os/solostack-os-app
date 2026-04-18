/**
 * Server-side sanitization for copy calibration examples.
 *
 * Applied in api/runs/route.ts before injecting copy_good_examples /
 * copy_bad_examples into generation prompts. Defense-in-depth against
 * prompt injection — the fields are already Pro-gated, but sanitizing
 * at injection time is the safer default.
 *
 * Not a security boundary on its own; treats the fields as untrusted
 * text that happens to go into an LLM context.
 *
 * ── Injection patterns stripped (12 regexes) ──────────────────────────────
 *
 * All patterns are multi-word to avoid false-positives on legitimate copy.
 * Single words like "ignore", "act", or "forget" appear in real ad copy;
 * the phrases below do not.
 *
 *  1. ignore (all) previous instructions
 *  2. ignore the (above|following)
 *  3. you are now (a|an) …
 *  4. disregard (all|your|the) …
 *  5. from now on (you|your) …
 *  6. forget (everything|all) (I …|previous…|your instructions…)
 *     — requires AI-directed follow-up; won't match "Forget everything
 *       you thought you knew about SaaS" (reader-directed copy)
 *  7. act as (if|a|an) …
 *  8. pretend (you are|to be)
 *  9. new instructions:      ← colon required, prevents "new instructions apply here"
 * 10. system prompt:          ← colon required
 * 11. [INST] / [/INST]        ← LLaMA 2 / Mistral chat tokens
 * 12. <|im_start|> / <|im_end|> ← ChatML / Mistral instruct tokens
 *
 * To extend: add to INJECTION_PATTERNS. Keep patterns multi-word.
 * To report a false positive: check whether the matched phrase appears in
 * a real copy sample — if so, tighten the regex rather than removing the rule.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions?/gi,   //  1
  /ignore\s+the\s+(above|following)/gi,              //  2
  /you\s+are\s+now\s+(a|an)\s/gi,                   //  3
  /disregard\s+(all|your|the)\s/gi,                  //  4
  /from\s+now\s+on\s+(you|your)/gi,                  //  5
  /forget\s+((everything|all)\s+(I\s+|previous)|your\s+instructions?)/gi, //  6
  /act\s+as\s+(if|a|an)\s/gi,                        //  7
  /pretend\s+(you\s+are|to\s+be)/gi,                 //  8
  /new\s+instructions?\s*:/gi,                        //  9
  /system\s+prompt\s*:/gi,                            // 10
  /\[INST\]|\[\/INST\]/g,                            // 11
  /<\|im_start\|>|<\|im_end\|>/g,                   // 12
];

/** Maximum characters retained per individual example. */
const MAX_CHARS_PER_EXAMPLE = 500;
/** Minimum characters retained when word-boundary truncation is applied. */
const MIN_CHARS_AFTER_WORD_BREAK = 400;
/** Maximum number of examples kept per field. */
const MAX_EXAMPLES = 3;

/**
 * Truncate a string at a word boundary near `max` chars.
 * Falls back to a hard cut only when no space is found within `[min, max]`.
 */
function truncateAtWord(text: string, max = MAX_CHARS_PER_EXAMPLE, min = MIN_CHARS_AFTER_WORD_BREAK): string {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(" ", max);
  return cut >= min ? text.slice(0, cut) : text.slice(0, max);
}

/**
 * Sanitize a copy calibration field before injecting it into a generation prompt.
 *
 * Steps:
 *   1. Strip prompt injection patterns.
 *   2. Split on blank lines (the natural separator when pasting multiple examples).
 *   3. Keep the first MAX_EXAMPLES chunks.
 *   4. Truncate each chunk at a word boundary near MAX_CHARS_PER_EXAMPLE.
 *   5. Rejoin with double newlines.
 *
 * Returns null for empty / whitespace-only input (consistent with DB nulls).
 */
export function sanitizeCopyExamples(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;

  let result = text;

  // 1. Strip injection patterns.
  for (const pattern of INJECTION_PATTERNS) {
    result = result.replace(pattern, "[removed]");
  }

  // 2–4. Split → cap count → truncate each.
  const chunks = result
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);

  const capped = chunks.slice(0, MAX_EXAMPLES).map((c) => truncateAtWord(c));

  // 5. Rejoin.
  result = capped.join("\n\n");

  return result.trim() || null;
}

/**
 * Count how many examples a raw field value would produce after splitting.
 * Used client-side to show the "only first 3 examples will be used" notice
 * before the user saves. Matches the server-side split logic exactly.
 */
export function countExamples(text: string): number {
  return text
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean).length;
}
