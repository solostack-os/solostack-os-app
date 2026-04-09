import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "onboarding_doc";

export interface OnboardingDocInput {
  client_name: string;
  service_type: string;
  start_date: string;
  key_deliverables: string;
}

export function runOnboardingDoc(
  context: WorkspaceContext,
  input: OnboardingDocInput,
  callStream: StreamFn = callClaudeStream
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const systemPrompt = `${brandPrefix}You are an expert at creating professional client onboarding documents. Your documents set clear expectations, build confidence, and make clients feel taken care of from day one.

Rules:
- Write a client onboarding document for ${input.client_name}.
- Service: ${input.service_type}. Start date: ${input.start_date}.
- Output exactly these sections: Welcome, Project Overview, Timeline, Communication, Next Steps.
- Label each section clearly.
- Separate each section with a horizontal rule (---).
- Welcome: warm, professional greeting that sets the tone.
- Project Overview: summarise scope and deliverables based on the provided list.
- Timeline: realistic phase-based milestones starting from the given date.
- Communication: preferred channels, response times, meeting cadence.
- Next Steps: 3-5 immediate action items for the client.
- Tone should be warm but professional.
- Output only the document. No preamble, no explanation.`;

  const userPrompt = `Create a client onboarding document.\n\nKey deliverables:\n${input.key_deliverables}`;

  return callStream(systemPrompt, userPrompt);
}
