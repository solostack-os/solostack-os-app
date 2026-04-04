import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function callClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<{ text: string; promptTokens: number; completionTokens: number }> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: systemPrompt,
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
