import OpenAI from "openai";

export const OPENAI_MODEL = "gpt-4o";

/**
 * Lazy client factory — the OpenAI SDK throws at construction time if
 * OPENAI_API_KEY is missing. Creating the client inside the constructor
 * (rather than at module level) ensures the error only fires when the
 * fallback is actually triggered at runtime, not during Next.js's build-
 * time module evaluation.
 */
function createClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

/**
 * A thin wrapper around OpenAI's ChatCompletionStream that exposes the same
 * interface used by the Anthropic MessageStream throughout the app:
 *
 *   - `.on("text", delta => ...)` — called for each text token
 *   - `.finalMessage()` — resolves with { usage: { input_tokens, output_tokens } }
 *   - `.abort()` — cancels the underlying HTTP request
 *
 * This lets app/api/runs/route.ts swap providers at runtime without changing
 * the streaming plumbing at all.
 */
export class OpenAIStreamWrapper {
  private _stream: ReturnType<ReturnType<typeof createClient>["chat"]["completions"]["stream"]>;
  private _textListeners: ((delta: string) => void)[] = [];
  private _started = false;

  constructor(systemPrompt: string, userPrompt: string) {
    this._stream = createClient().chat.completions.stream({
      model: OPENAI_MODEL,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
  }

  /** Mirror of Anthropic MessageStream.on("text", ...) */
  on(event: string, listener: (delta: string) => void): this {
    if (event === "text") {
      this._textListeners.push(listener);
      // Start driving the stream on first listener attach (matches Anthropic behaviour)
      if (!this._started) this._start();
    }
    return this;
  }

  private _start() {
    this._started = true;
    this._stream.on("chunk", (chunk) => {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        for (const fn of this._textListeners) fn(delta);
      }
    });
  }

  /**
   * Resolves with a minimal usage object that matches what api/runs/route.ts
   * reads from the Anthropic finalMessage result.
   *
   * Uses finalChatCompletion() (not finalMessage()) because only ChatCompletion
   * objects carry the top-level `usage` field.
   */
  async finalMessage(): Promise<{
    usage: { input_tokens: number; output_tokens: number };
  }> {
    const completion = await this._stream.finalChatCompletion();
    return {
      usage: {
        input_tokens: completion.usage?.prompt_tokens ?? 0,
        output_tokens: completion.usage?.completion_tokens ?? 0,
      },
    };
  }

  /** Cancel the underlying OpenAI request (mirrors Anthropic stream.abort()). */
  abort() {
    try {
      this._stream.abort();
    } catch {
      // Already finished — safe to swallow.
    }
  }
}

/**
 * Creates a streaming OpenAI call with the same call signature as
 * callClaudeStream so the route can use either interchangeably.
 */
export function callOpenAIStream(systemPrompt: string, userPrompt: string) {
  return new OpenAIStreamWrapper(systemPrompt, userPrompt);
}
