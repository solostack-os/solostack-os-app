import Anthropic from "@anthropic-ai/sdk";
import { LANGUAGE_RULE } from "@/lib/ai/language-rule";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * Shared type for the stream factory function used by all workflows.
 * Allows route.ts to swap the underlying AI provider at runtime (e.g.
 * falling back to OpenAI when Anthropic is overloaded) without changing
 * any workflow file.
 */
export type StreamFn = (systemPrompt: string, userPrompt: string) => {
  on(event: "text", listener: (delta: string) => void): unknown;
  finalMessage(): Promise<{ usage: { input_tokens: number; output_tokens: number } }>;
  abort(): void;
};

// Single source of truth for the model ID. When swapping models, change
// this and the matching `model_name` column written in app/api/runs/route.ts.
export const CLAUDE_MODEL = "claude-sonnet-4-6";


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
