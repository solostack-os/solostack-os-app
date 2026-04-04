import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaude } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "social_posts";

export interface SocialPostsInput {
  platform: "instagram" | "linkedin" | "facebook";
  topic: string;
  num_posts: number;
}

const platformGuidance: Record<SocialPostsInput["platform"], string> = {
  instagram:
    "Write for Instagram. Use short punchy paragraphs, line breaks for readability, and suggest 3-5 relevant hashtags at the end of each post. Keep it visual and engaging.",
  linkedin:
    "Write for LinkedIn. Use a professional but human tone, open with a hook, include line breaks between paragraphs, and end with a thought-provoking question or call to action. No hashtags unless they add clear value.",
  facebook:
    "Write for Facebook. Keep it conversational, relatable, and easy to engage with. Moderate length. End with a question or CTA to drive comments.",
};

export async function runSocialPosts(
  context: WorkspaceContext,
  input: SocialPostsInput
) {
  const contextPacket = buildContextPacket(context);

  const systemPrompt = `You are an expert social media copywriter. You write posts that sound human, not AI-generated. You adapt to the brand's voice and audience.

Here is the business context you must reflect in every post:
${contextPacket}

Rules:
- Write exactly ${input.num_posts} post(s).
- ${platformGuidance[input.platform]}
- Separate each post with a horizontal rule (---).
- Output only the posts in markdown. No preamble, no explanation, no numbering like "Post 1:".`;

  const userPrompt = `Write ${input.num_posts} ${input.platform} post(s) about: ${input.topic}`;

  return callClaude(systemPrompt, userPrompt);
}
