import { buildContextPacket, currentDate, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "sop_generator";

export interface SopGeneratorInput {
  process_name: string;
  department: "operations" | "marketing" | "sales" | "finance";
  detail_level: "summary" | "standard" | "detailed";
  additional_context?: string;
}

const detailGuidance: Record<SopGeneratorInput["detail_level"], string> = {
  summary:
    "Keep it concise — one paragraph per section, high-level steps only. Aim for a quick-reference document.",
  standard:
    "Moderate detail — clear step-by-step instructions with enough context for someone unfamiliar with the process. Include key decision points.",
  detailed:
    "Maximum detail — granular step-by-step instructions, sub-steps where needed, responsible parties for each step, expected timeframes, and edge cases.",
};

export function runSopGenerator(
  context: WorkspaceContext,
  input: SopGeneratorInput,
  callStream: StreamFn = callClaudeStream
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const extraInstructions = input.additional_context?.trim()
    ? `\n\nAdditional user instructions (treat these as high-priority and follow them carefully):\n${input.additional_context.trim()}`
    : "";

  const systemPrompt = `${brandPrefix}You are an expert operations consultant who writes clear, actionable standard operating procedures. Your SOPs are practical, easy to follow, and tailored to the business.

Rules:
- Write for the ${input.department} department.
- ${detailGuidance[input.detail_level]}
- Output exactly these sections: Purpose, Scope, Roles & Responsibilities, Step-by-Step Process, Notes & Exceptions.
- Label each section clearly.
- Separate each section with a horizontal rule (---).
- Use numbered steps in the Step-by-Step Process section.
- Output only the SOP. No preamble, no explanation.${extraInstructions}`;

  const userPrompt = `Current date: ${currentDate()}.

Write a standard operating procedure for: ${input.process_name}`;

  return callStream(systemPrompt, userPrompt);
}
