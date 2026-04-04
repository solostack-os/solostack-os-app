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
    "Write for Instagram. Max 150 words per post. Use short, punchy paragraphs with line breaks for readability. Conversational and engaging tone. End each post with 3-5 relevant hashtags (never more than 5).",
  linkedin:
    "Write for LinkedIn. Max 250 words per post. Professional but human tone. Open with a strong hook, use line breaks between paragraphs, structure the post clearly, and end with a thought-provoking question or call to action. Use no more than 3 hashtags — omit them entirely if they don't add clear value.",
  facebook:
    "Write for Facebook. Max 100 words per post. Warm, conversational, and engaging tone. Keep it relatable and easy to interact with. End with a question or CTA to drive comments. Use 1-2 hashtags at most.",
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
