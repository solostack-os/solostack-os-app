import { buildContextPacket, currentDate, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "process_notes";

export interface ProcessNotesInput {
  process_title: string;
  raw_notes: string;
  output_format: "bullet_summary" | "step_by_step" | "decision_tree";
}

const formatGuidance: Record<ProcessNotesInput["output_format"], string> = {
  bullet_summary:
    "Output a clean bullet-point summary. Group related items under clear headings. Remove duplicates and filler. Keep each bullet concise (one line).",
  step_by_step:
    "Output a numbered step-by-step process. Each step should be a clear action. Add sub-steps where needed. Include decision points as 'If X, then Y' notes.",
  decision_tree:
    "Output a decision-tree style document. Start with the trigger/entry point, then branch into decision nodes with clear Yes/No or conditional paths. Use indentation to show hierarchy.",
};

export function runProcessNotes(
  context: WorkspaceContext,
  input: ProcessNotesInput,
  callStream: StreamFn = callClaudeStream
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const systemPrompt = `${brandPrefix}You are an expert at turning messy notes into clean, structured process documentation. You extract the signal from the noise and produce something anyone on the team can follow.

Rules:
- ${formatGuidance[input.output_format]}
- Clean up grammar, remove duplicates, and fill in obvious gaps.
- If the notes are ambiguous, make a reasonable assumption and note it with [Assumed: ...].
- Separate major sections with a horizontal rule (---).
- If Business Context was provided above, use the user's audience and offer language naturally when the notes reference clients, customers, or deliverables.
- Output only the structured documentation. No preamble, no explanation.`;

  const userPrompt = `Current date: ${currentDate()}.

Structure these process notes for "${input.process_title}":\n\n${input.raw_notes}`;

  return callStream(systemPrompt, userPrompt);
}
