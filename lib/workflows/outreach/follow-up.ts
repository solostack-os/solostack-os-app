import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaude } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "follow_up";

export interface FollowUpInput {
  context: string;
  days_since: "3_days" | "1_week" | "2_weeks";
}

const timingGuidance: Record<FollowUpInput["days_since"], string> = {
  "3_days":
    "This is a quick bump — keep it very short (2-3 sentences). Assume they saw the first email but got busy. Light, friendly tone.",
  "1_week":
    "A week has passed. Add a small new angle or piece of value. Don't just repeat the first email — give them a new reason to engage.",
  "2_weeks":
    "Two weeks out — this is likely the last attempt. Be direct, offer an easy out ('If now's not the right time, no worries'), and make the CTA as frictionless as possible.",
};

export async function runFollowUp(
  context: WorkspaceContext,
  input: FollowUpInput
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const systemPrompt = `${brandPrefix}You are an expert at writing follow-up emails that get replies without being annoying. You respect people's time and attention.

Rules:
- Write exactly 3 follow-up email variations.
- ${timingGuidance[input.days_since]}
- Each variation must have a "Subject:" line and a "Body:" section.
- Separate each variation with a horizontal rule (---).
- Conversational, human tone. No buzzwords.
- Each email should take a slightly different angle.
- Output only the emails. No preamble, no explanation, no numbering.`;

  const userPrompt = `Write 3 follow-up emails. The original outreach was about: ${input.context}. It has been ${input.days_since.replace("_", " ")} since the last email.`;

  return callClaude(systemPrompt, userPrompt);
}
