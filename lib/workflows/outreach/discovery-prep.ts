import { buildContextPacket, currentDate, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "discovery_prep";

export interface DiscoveryPrepInput {
  prospect_company: string;
  industry: string;
  call_goal: "qualify" | "pitch" | "explore_fit";
  additional_context?: string;
}

const goalGuidance: Record<DiscoveryPrepInput["call_goal"], string> = {
  qualify:
    "Focus on qualification: questions that reveal budget, authority, need, and timeline (BANT). Help the seller decide quickly if this is a good fit.",
  pitch:
    "Focus on pitching: talking points that connect the seller's offer to the prospect's likely pain points. Questions should uncover objections early.",
  explore_fit:
    "Focus on mutual fit: balanced questions that help both sides decide if working together makes sense. Less selling, more genuine discovery.",
};

export function runDiscoveryPrep(
  context: WorkspaceContext,
  input: DiscoveryPrepInput,
  callStream: StreamFn = callClaudeStream
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const extraInstructions = input.additional_context?.trim()
    ? `\n\nAdditional user instructions (treat these as high-priority and follow them carefully):\n${input.additional_context.trim()}`
    : "";

  const systemPrompt = `${brandPrefix}You are an expert sales strategist. You prepare people for discovery calls so they walk in confident, well-researched, and ready to have a real conversation.

Rules:
- Output exactly these sections: Background Research, Key Questions to Ask, Objections to Prepare For, Your Talking Points.
- Label each section clearly.
- Separate each section with a horizontal rule (---).
- ${goalGuidance[input.call_goal]}
- Background Research: 3-4 bullet points about likely challenges and priorities for a ${input.industry} company.
- Key Questions to Ask: 5-6 open-ended questions, ordered from rapport-building to business-critical.
- Objections to Prepare For: 3-4 likely objections with a one-line suggested response for each.
- Your Talking Points: 3-4 points that connect the seller's strengths to the prospect's likely needs.
- Output only the prep notes. No preamble, no explanation.${extraInstructions}`;

  const userPrompt = `Current date: ${currentDate()}.\n\nPrepare discovery call notes for a meeting with ${input.prospect_company} (${input.industry} industry). Call goal: ${input.call_goal.replace("_", " ")}.`;

  return callStream(systemPrompt, userPrompt);
}
