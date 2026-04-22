/**
 * Strip the server-appended __META:{...}__ telemetry token from streamed output.
 *
 * The /api/runs endpoint appends `\n__META:{"provider":"anthropic|openai"}__`
 * as the final stream token. This must be removed before rendering or copying.
 */

const META_RE = /\n__META:(\{[^}]+\})__\s*$/;

export function stripMeta(text: string): { clean: string; provider: string | null } {
  const m = text.match(META_RE);
  if (!m) return { clean: text, provider: null };
  let provider: string | null = null;
  try {
    const parsed = JSON.parse(m[1]);
    provider = parsed.provider ?? null;
  } catch { /* malformed — ignore */ }
  return { clean: text.slice(0, text.length - m[0].length), provider };
}
