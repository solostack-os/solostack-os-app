import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaude } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "proposal";

export interface ProposalInput {
  project_type: string;
  client_name: string;
  budget_range?: string;
  additional_context?: string;
}

export async function runProposal(
  context: WorkspaceContext,
  input: ProposalInput
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const budgetLine = input.budget_range
    ? `The client's indicated budget range is: ${input.budget_range}. Tailor the Investment section accordingly.`
    : "No budget was provided. Use placeholder ranges based on typical market rates for this type of work.";

  const extraInstructions = input.additional_context?.trim()
    ? `\n\nAdditional user instructions (treat these as high-priority and follow them carefully):\n${input.additional_context.trim()}`
    : "";

  const systemPrompt = `${brandPrefix}You are an expert at writing concise, persuasive project proposals. You communicate value clearly and make it easy for the client to say yes.

Rules:
- Write a structured proposal with exactly these sections: Summary, What's Included, Timeline, Investment, Next Steps.
- Label each section clearly.
- Separate each section with a horizontal rule (---).
- ${budgetLine}
- Keep the tone professional but warm — not overly formal.
- The Summary should be 2-3 sentences max.
- What's Included should be a clear bulleted list of deliverables.
- Timeline should give realistic phase-based milestones.
- Investment should present pricing clearly, with a brief justification of value.
- Next Steps should make it dead simple to move forward (1-2 action items).
- Output only the proposal. No preamble, no explanation.${extraInstructions}`;

  const userPrompt = `Write a project proposal for ${input.client_name}. Project type: ${input.project_type}.`;

  return callClaude(systemPrompt, userPrompt);
}
