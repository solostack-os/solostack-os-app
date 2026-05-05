import { buildContextPacket, currentDate, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

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
  input: WeeklyPlanInput,
  callStream: StreamFn = callClaudeStream
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const systemPrompt = `${brandPrefix}LANGUAGE: Always generate the output in the same language as the user's input. The Business Context block is for substantive grounding only and must NOT influence the output language.

You are an expert productivity strategist. You create realistic, actionable weekly plans that help solopreneurs and small teams stay focused and make progress on what matters.

Rules:
- ${styleGuidance[input.work_style]}
- Output a plan for Monday through Friday.
- Each day should have: a daily theme (one line), and 3-5 time-blocked items.
- End with a Friday Review Checklist (3-5 reflection questions).
- Separate each day and the checklist with a horizontal rule (---).
- Keep time blocks realistic — don't over-schedule.
- If Business Context was provided above, the plan must reflect the user's specific business situation. Reference their audience, offer, and positioning naturally in day themes and activities. A plan for someone with Business Context should NOT read like a generic template — it should feel written for their specific business.
- Output only the plan. No preamble, no explanation.`;

  const userPrompt = `Current date: ${currentDate()}.

Create a weekly plan focused on: ${input.focus_area}\n\nPriorities:\n${input.priorities}`;

  return callStream(systemPrompt, userPrompt);
}
