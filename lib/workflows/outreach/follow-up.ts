import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "follow_up";

export interface FollowUpInput {
  context: string;
  days_since: "3_days" | "1_week" | "2_weeks";
}

const timingGuidance: Record<FollowUpInput["days_since"], string> = {
  "3_days":
    "This is a quick bump — keep it very short (2-3 sentences). Assume they saw the first email but got busy. Light, friendly tone. No hard sell.",
  "1_week":
    "A week has passed. Add a small new angle or piece of value. Don't repeat the first email — give them one fresh reason to engage.",
  "2_weeks":
    "Two weeks out — this may be the last attempt. Be direct, offer an easy out ('If now's not the right time, no worries'), and make the CTA as frictionless as possible.",
};

export function runFollowUp(
  context: WorkspaceContext,
  input: FollowUpInput,
  callStream: StreamFn = callClaudeStream
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const systemPrompt = `${brandPrefix}You are an expert at writing follow-up emails that get replies without being annoying. You respect people's time and attention.

Rules:
- Write exactly 1 follow-up email.
- ${timingGuidance[input.days_since]}
- Must have a "Subject:" line and a "Body:" section, separated by a horizontal rule (---).
- Conversational, human tone. No buzzwords or generic filler phrases.
- Reference specific details from the original email context to make it feel personal and relevant, not copy-pasted.
- Output only the email. No preamble, no explanation.`;

  const userPrompt = `Write a follow-up email. The original outreach was about: ${input.context}. It has been ${input.days_since.replace("_", " ")} since the last email.`;

  return callStream(systemPrompt, userPrompt);
}
