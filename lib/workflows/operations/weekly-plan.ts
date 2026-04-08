import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "weekly_plan";

export interface WeeklyPlanInput {
  focus_area: string;
  priorities: string;
  work_style: "deep_work" | "mixed" | "meetings_heavy";
}

const styleGuidance: Record<WeeklyPlanInput["work_style"], string> = {
  deep_work:
    "Optimise for deep focus blocks — schedule 3-4 hour uninterrupted slots, batch meetings into one or two days, protect mornings for creative/strategic work.",
  mixed:
    "Balance focus time and collaboration — alternate between deep work blocks and meeting slots, keep afternoons flexible for ad-hoc tasks.",
  meetings_heavy:
    "Work around a packed meeting schedule — use short focus sprints (60-90 min) between meetings, front-load prep work early in the day, keep Fridays lighter where possible.",
};

export function runWeeklyPlan(
  context: WorkspaceContext,
  input: WeeklyPlanInput
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const systemPrompt = `${brandPrefix}You are an expert productivity strategist. You create realistic, actionable weekly plans that help solopreneurs and small teams stay focused and make progress on what matters.

Rules:
- ${styleGuidance[input.work_style]}
- Output a plan for Monday through Friday.
- Each day should have: a daily theme (one line), and 3-5 time-blocked items.
- End with a Friday Review Checklist (3-5 reflection questions).
- Separate each day and the checklist with a horizontal rule (---).
- Keep time blocks realistic — don't over-schedule.
- Output only the plan. No preamble, no explanation.`;

  const userPrompt = `Create a weekly plan focused on: ${input.focus_area}\n\nPriorities:\n${input.priorities}`;

  return callClaudeStream(systemPrompt, userPrompt);
}
