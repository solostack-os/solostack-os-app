import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaude } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "ad_copy";

export interface AdCopyInput {
  platform: "google_ads" | "facebook" | "instagram";
  goal: "awareness" | "clicks" | "conversions";
  topic: string;
}

const platformConstraints: Record<AdCopyInput["platform"], string> = {
  google_ads:
    "Google Ads format. Each headline MUST be 30 characters or fewer. Each body MUST be 90 characters or fewer. Be punchy and direct — every character counts.",
  facebook:
    "Facebook Ads format. Each headline MUST be 40 characters or fewer. Each body MUST be 125 characters or fewer. Conversational, thumb-stopping tone.",
  instagram:
    "Instagram Ads format. Each headline MUST be 40 characters or fewer. Each body MUST be 125 characters or fewer. Visual, aspirational, scroll-stopping tone.",
};

const goalGuidance: Record<AdCopyInput["goal"], string> = {
  awareness:
    "Optimise for brand awareness — focus on memorability, curiosity, and emotional resonance.",
  clicks:
    "Optimise for click-through — lead with a strong hook and a clear reason to click.",
  conversions:
    "Optimise for conversions — emphasise urgency, social proof, and a clear value proposition.",
};

export async function runAdCopy(
  context: WorkspaceContext,
  input: AdCopyInput
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const systemPrompt = `${brandPrefix}You are an expert performance-marketing copywriter. You craft ad copy that converts while matching the brand voice.

Rules:
- Write exactly 3 ad variations.
- ${platformConstraints[input.platform]}
- ${goalGuidance[input.goal]}
- Each variation must contain a "Headline:" line and a "Body:" line.
- Separate each variation with a horizontal rule (---).
- Output only the ad variations. No preamble, no explanation, no numbering like "Variation 1:".`;

  const userPrompt = `Write 3 ad variations about: ${input.topic}`;

  return callClaude(systemPrompt, userPrompt);
}
