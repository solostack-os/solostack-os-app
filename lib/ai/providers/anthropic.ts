import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Single source of truth for the model ID. When swapping models, change
// this and the matching `model_name` column written in app/api/runs/route.ts.
export const CLAUDE_MODEL = "claude-sonnet-4-6";

/**
 * Universal language rule appended to every system prompt.
 *
 * The bug this rule guards against: workspace brand context (company
 * description, brand voice, etc.) gets prepended to the system prompt
 * via buildContextPacket. If that context is in Romanian but the user
 * types an English topic, Claude can pick up the Romanian language
 * signal from the system prompt and respond in Romanian. The fix is to
 * explicitly forbid using the system prompt for language detection —
 * the user message is the ONLY signal that matters.
 *
 * English is the platform default. We only switch languages when the
 * user message itself is clearly in another language.
 */
const LANGUAGE_RULE = `IMPORTANT — Output language detection rules:
1. Determine your response language ONLY from the user's message (the message with role "user"). NEVER from this system prompt.
2. The system prompt above may contain brand context, company descriptions, or brand voice notes written in any language (Romanian, French, English, etc.). IGNORE all of that text when deciding what language to respond in. The brand context exists only to inform tone, voice, and style — never the output language.
3. Look at the actual text the user typed in their message (the topic, notes, or content fields). If that text is clearly in English, respond in English. If you cannot tell what language it's in, default to English.
4. Only switch to a non-English language when the user's own typed text is unambiguously in that language. For example: a Romanian topic → Romanian response; an English topic → English response, even if the brand description is in Romanian.`;

/**
 * Non-streaming call — used by topic_suggestions, which parses the result as
 * JSON in one shot and has no use for progressive rendering.
 */
export async function callClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<{ text: string; promptTokens: number; completionTokens: number }> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `${systemPrompt}\n\n${LANGUAGE_RULE}`,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n\n");

  return {
    text,
    promptTokens: response.usage.input_tokens,
    completionTokens: response.usage.output_tokens,
  };
}

/**
 * Streaming call — used by every user-facing workflow so tokens can be
 * rendered in the browser as they arrive. The returned MessageStream exposes
 *   - `.on("text", delta => ...)` for per-token deltas, and
 *   - `.finalMessage()` which resolves with the complete Message (including
 *     usage.input_tokens / usage.output_tokens) once the stream ends.
 *
 * The HTTP request is initiated synchronously during construction, so firing
 * this concurrently with other work (e.g. the run-record INSERT) in the
 * caller is trivial.
 */
export function callClaudeStream(systemPrompt: string, userPrompt: string) {
  return client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `${systemPrompt}\n\n${LANGUAGE_RULE}`,
    messages: [{ role: "user", content: userPrompt }],
  });
}
