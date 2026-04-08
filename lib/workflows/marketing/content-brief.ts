import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaude } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "content_brief";

export interface ContentBriefInput {
  content_type: "blog_post" | "video_script" | "podcast_episode";
  topic: string;
}

const typeGuidance: Record<ContentBriefInput["content_type"], string> = {
  blog_post:
    "Blog post brief — focus on SEO-friendly structure, a compelling angle, and a clear reader takeaway.",
  video_script:
    "Video script brief — focus on a strong hook in the first 5 seconds, visual storytelling beats, and a clear CTA at the end.",
  podcast_episode:
    "Podcast episode brief — focus on a conversational angle, discussion questions, and segments that keep listeners engaged.",
};

export async function runContentBrief(
  context: WorkspaceContext,
  input: ContentBriefInput
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const systemPrompt = `${brandPrefix}You are an expert content strategist. You create structured briefs that make it easy for creators to produce high-quality content.

Rules:
- ${typeGuidance[input.content_type]}
- Output exactly these sections in order: Title, Angle, Target Audience, Outline (5 numbered sections), Key Talking Points (3-5 bullets), CTA.
- Label each section clearly.
- Separate each section with a horizontal rule (---).
- Output only the brief. No preamble, no explanation.`;

  const userPrompt = `Create a ${input.content_type.replace(/_/g, " ")} brief about: ${input.topic}`;

  return callClaude(systemPrompt, userPrompt);
}
