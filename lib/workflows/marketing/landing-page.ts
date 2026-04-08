import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaude } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "landing_page";

export interface LandingPageInput {
  section: "hero" | "features" | "cta" | "faq" | "testimonial_prompt";
  goal: "lead_gen" | "sales" | "waitlist";
  topic: string;
}

const sectionGuidance: Record<LandingPageInput["section"], string> = {
  hero:
    "Generate Hero section copy: a bold headline, a supporting sub-headline, and a short paragraph (2-3 sentences). Separate each element with ---.",
  features:
    "Generate Features section copy: 3-4 feature blocks, each with a short title and a one-sentence description. Separate each feature block with ---.",
  cta:
    "Generate CTA section copy: a compelling headline, a brief supporting sentence, and a button label. Separate each element with ---.",
  faq:
    "Generate FAQ section copy: 4-5 question-and-answer pairs. Each pair should have the question on one line and the answer below it. Separate each Q&A pair with ---.",
  testimonial_prompt:
    "Generate 3 fictional but realistic customer testimonial prompts (name, role, and a short quote). These serve as placeholder copy for the testimonial section. Separate each testimonial with ---.",
};

const goalGuidance: Record<LandingPageInput["goal"], string> = {
  lead_gen:
    "Optimise copy for lead generation — stress the free value, lower the commitment bar, and make the opt-in irresistible.",
  sales:
    "Optimise copy for direct sales — highlight ROI, urgency, and social proof.",
  waitlist:
    "Optimise copy for waitlist sign-ups — build anticipation, exclusivity, and FOMO.",
};

export async function runLandingPage(
  context: WorkspaceContext,
  input: LandingPageInput
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const systemPrompt = `${brandPrefix}You are an expert landing-page copywriter. You write conversion-focused copy that sounds human and matches the brand voice.

Rules:
- ${sectionGuidance[input.section]}
- ${goalGuidance[input.goal]}
- Output only the copy elements. No preamble, no explanation.`;

  const userPrompt = `Write ${input.section.replace("_", " ")} section copy about: ${input.topic}`;

  return callClaude(systemPrompt, userPrompt);
}
