import { buildContextPacket, currentDate, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "cold_email";

export interface ColdEmailInput {
  prospect_name: string;
  prospect_role: string;
  prospect_company: string;
  goal: "book_a_call" | "get_a_reply" | "share_a_resource";
  additional_context?: string;
}

const goalGuidance: Record<ColdEmailInput["goal"], string> = {
  book_a_call:
    "The CTA should ask for a short meeting or call. Make it easy to say yes — suggest a specific time frame and keep the commitment low.",
  get_a_reply:
    "The CTA should ask a simple question that invites a reply. No hard sell — just start a conversation.",
  share_a_resource:
    "The CTA should share something genuinely useful (guide, case study, tool) and invite them to check it out. Position it as giving, not asking.",
};

export function runColdEmail(
  context: WorkspaceContext,
  input: ColdEmailInput,
  callStream: StreamFn = callClaudeStream
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const extraInstructions = input.additional_context?.trim()
    ? `\n\nAdditional user instructions (treat these as high-priority and follow them carefully):\n${input.additional_context.trim()}`
    : "";

  const systemPrompt = `${brandPrefix}You are an expert cold-email copywriter. You write emails that get opened and replied to. Your style is conversational, specific, and human — never salesy or generic.

Rules:
- Max 150 words for the entire email.
- Conversational tone — write like a real person, not a marketer.
- No buzzwords (synergy, leverage, unlock, revolutionize, etc.).
- One clear CTA only.
- ${goalGuidance[input.goal]}
- Output exactly two sections: "Subject:" and "Body:" — separated by a horizontal rule (---).
- Output only the email. No preamble, no explanation.${extraInstructions}`;

  const userPrompt = `Current date: ${currentDate()}.\n\nWrite a cold email to ${input.prospect_name}, ${input.prospect_role} at ${input.prospect_company}.`;

  return callStream(systemPrompt, userPrompt);
}
