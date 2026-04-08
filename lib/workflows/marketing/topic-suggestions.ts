import { callClaude } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "topic_suggestions";

export interface TopicSuggestionsInput {
  platform: "instagram" | "linkedin" | "facebook";
}

const platformTips: Record<TopicSuggestionsInput["platform"], string> = {
  instagram:
    "Topics should suit Instagram: visual storytelling, behind-the-scenes moments, carousels, reels hooks, and lifestyle-oriented angles.",
  linkedin:
    "Topics should suit LinkedIn: thought leadership, industry insights, professional lessons learned, data-driven takes, and career/business growth angles.",
  facebook:
    "Topics should suit Facebook: community engagement, relatable stories, tips & advice, questions that spark discussion, and shareable how-to content.",
};

/**
 * Topic suggestions are intentionally brand-agnostic: they help users get
 * unstuck when picking what to write about, so they must NOT reference the
 * current workspace's company/industry/brand voice. This is the one workflow
 * that deliberately skips buildContextPacket — see the system prompt rules.
 */
export async function runTopicSuggestions(input: TopicSuggestionsInput) {
  const systemPrompt = `You are an expert social media strategist. You generate short, punchy, brand-agnostic content topic ideas that any business could use as a starting point.

Platform: ${input.platform}
${platformTips[input.platform]}

Rules:
- Generate exactly 5 topic ideas.
- Each topic should be a single short sentence or phrase (under 80 characters).
- Topics should be concrete and actionable, not vague filler.
- Keep ideas brand-agnostic — do NOT reference any specific company name, industry, product, or target audience. Never personalise.
- Every topic must be appropriate for ${input.platform} specifically.
- Output ONLY a raw JSON array of strings. No markdown, no code blocks, no backticks, no explanation. Just the array. Example: ["Topic one","Topic two","Topic three","Topic four","Topic five"]`;

  const userPrompt = `Generate 5 generic ${input.platform} post topic ideas.`;

  return callClaude(systemPrompt, userPrompt);
}
