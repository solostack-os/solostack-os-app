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
 */

// Multi-word patterns only — single words like "ignore" or "act"
// would false-positive on legitimate copy samples.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions?/gi,
  /ignore\s+the\s+(above|following)/gi,
  /you\s+are\s+now\s+(a|an)\s/gi,
  /disregard\s+(all|your|the)\s/gi,
  /from\s+now\s+on\s+(you|your)/gi,
  /forget\s+(everything|all)\s/gi,
  /act\s+as\s+(if|a|an)\s/gi,
  /pretend\s+(you\s+are|to\s+be)/gi,
  /new\s+instructions?\s*:/gi,
  /system\s+prompt\s*:/gi,
  /\[INST\]|\[\/INST\]/g,
  /<\|im_start\|>|<\|im_end\|>/g,
];

/** Max characters kept per field — 3 examples × ~500 chars each. */
const MAX_TOTAL_CHARS = 1500;

/**
 * Strip prompt injection patterns and truncate to the allowed length.
 * Returns null for empty / whitespace-only input (consistent with DB nulls).
 */
export function sanitizeCopyExamples(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;

  let result = text;

  for (const pattern of INJECTION_PATTERNS) {
    result = result.replace(pattern, "[removed]");
  }

  if (result.length > MAX_TOTAL_CHARS) {
    result = result.slice(0, MAX_TOTAL_CHARS);
  }

  return result.trim() || null;
}
