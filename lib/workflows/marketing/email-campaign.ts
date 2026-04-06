import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaude } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "email_campaign";

export interface EmailCampaignInput {
  email_type: "welcome" | "promotional" | "nurture" | "re_engagement";
  topic: string;
}

const typeGuidance: Record<EmailCampaignInput["email_type"], string> = {
  welcome:
    "Welcome email — warm, friendly, sets expectations. Introduce the brand, highlight what the subscriber will get, and include a soft CTA.",
  promotional:
    "Promotional email — urgency-driven, benefit-focused. Lead with the offer, use social proof, and close with a strong CTA and deadline if applicable.",
  nurture:
    "Nurture email — educational, value-first. Share a useful insight or tip, position the brand as an expert, and gently point toward the next step.",
  re_engagement:
    "Re-engagement email — personal, curiosity-driven. Acknowledge the absence, remind them of the value, and offer a compelling reason to return.",
};

export async function runEmailCampaign(
  context: WorkspaceContext,
  input: EmailCampaignInput
) {
  const contextPacket = buildContextPacket(context);

  const systemPrompt = `You are an expert email marketer. You write emails that get opened, read, and clicked — while sounding human and on-brand.

Here is the business context you must reflect:
${contextPacket}

Rules:
- ${typeGuidance[input.email_type]}
- Output exactly three sections in this order: Subject Line, Preview Text, Email Body.
- Label each section clearly (e.g. "Subject Line:", "Preview Text:", "Email Body:").
- Separate each section with a horizontal rule (---).
- The email body should use short paragraphs and be ready to paste into an email tool.
- Output only the email. No preamble, no explanation.`;

  const userPrompt = `Write a ${input.email_type.replace("_", " ")} email about: ${input.topic}`;

  return callClaude(systemPrompt, userPrompt);
}
