import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaude } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "topic_suggestions";

export interface TopicSuggestionsInput {
  platform: "instagram" | "linkedin" | "facebook";
}

export async function runTopicSuggestions(
  context: WorkspaceContext,
  input: TopicSuggestionsInput
) {
  const contextPacket = buildContextPacket(context);

  const systemPrompt = `You are an expert social media strategist. Given a business context, you generate short, punchy post topic ideas that would resonate with the target audience.

Here is the business context:
${contextPacket}

Rules:
- Generate exactly 5 topic ideas.
- Each topic should be a single short sentence or phrase (under 80 characters).
- Topics should be specific and actionable, not generic.
- Tailor topics to ${input.platform}.
- Output ONLY a raw JSON array of strings. No markdown, no code blocks, no backticks, no explanation. Just the array. Example: ["Topic one","Topic two","Topic three","Topic four","Topic five"]`;

  const userPrompt = `Generate 5 ${input.platform} post topic ideas for this business.`;

  return callClaude(systemPrompt, userPrompt);
}
