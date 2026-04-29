import { buildContextPacket, currentDate, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "vo_script";

export interface VoScriptInput {
  duration: "15" | "30" | "60" | "90" | "custom";
  custom_seconds?: number;
  format: "commercial_ad" | "corporate_brand" | "educational_explainer" | "radio_spot" | "podcast_intro_outro" | "presentation";
  pace: "slow_premium" | "standard_conversational" | "energetic_punchy";
  goal: "inform" | "persuade" | "convert" | "inspire";
  topic: string;
  include_direction: boolean;
}

/* ─── Duration → word count mapping ─── */
const paceWordsPerSecond: Record<VoScriptInput["pace"], { min: number; max: number; label: string }> = {
  slow_premium:            { min: 2.3, max: 2.5, label: "Slow / Premium" },
  standard_conversational: { min: 2.5, max: 2.8, label: "Standard / Conversational" },
  energetic_punchy:        { min: 2.8, max: 3.2, label: "Energetic / Punchy" },
};

function getDurationSeconds(input: VoScriptInput): number {
  if (input.duration === "custom") return input.custom_seconds ?? 30;
  return parseInt(input.duration, 10);
}

function getWordRange(input: VoScriptInput): { min: number; max: number; seconds: number } {
  const seconds = getDurationSeconds(input);
  const wps = paceWordsPerSecond[input.pace];
  return {
    min: Math.round(seconds * wps.min),
    max: Math.round(seconds * wps.max),
    seconds,
  };
}

/* ─── Format descriptions ─── */
const formatGuidance: Record<VoScriptInput["format"], string> = {
  commercial_ad: "Commercial ad — high impact, clear product/service positioning, ends with memorable tagline or CTA. Think TV/YouTube pre-roll.",
  corporate_brand: "Corporate brand film — aspirational, values-driven, builds emotional connection. Think brand manifesto or 'about us' narration.",
  educational_explainer: "Educational explainer — clear, structured, teaches or demonstrates. Think product tour or how-it-works video.",
  radio_spot: "Radio spot — audio-only, no visual crutches. Must paint pictures with words. Strong sonic rhythm, natural for broadcast.",
  podcast_intro_outro: "Podcast intro/outro — establishes show identity, energizes listener, consistent tone across episodes. Brief and punchy.",
  presentation: "Presentation voiceover — accompanies slides or visuals. Complementary, not redundant. Paces with visual transitions.",
};

/* ─── Goal context ─── */
const goalContext: Record<VoScriptInput["goal"], string> = {
  inform: "Primary goal: INFORM — deliver key facts clearly and memorably. Prioritize clarity and retention over emotion.",
  persuade: "Primary goal: PERSUADE — shift the listener's perspective. Build a case through evidence, contrast, or reframing.",
  convert: "Primary goal: CONVERT — drive a specific action. End with an unambiguous CTA. Remove friction from the ask.",
  inspire: "Primary goal: INSPIRE — create an emotional response. Use vivid language, rising energy, and a resonant closing line.",
};

/* ─── System prompt ─── */
const SYSTEM_PROMPT = `You are an expert voiceover scriptwriter. You write for the EAR, not the eye. Every script you produce is designed to be read aloud by a professional voice artist.

## Core principles

Short declarative sentences. Natural breath rhythm. The listener cannot re-read — every sentence must land on first hearing.

Paragraph breaks are structural breath pauses, not cosmetic. Each paragraph is one breath group. Place a paragraph break where the reader would naturally pause for 1-2 seconds.

Avoid hard-to-pronounce jargon and tongue-twisters. Read every sentence aloud in your head. If it trips the tongue, rewrite it.

Prefer present tense indicative. Avoid stacked conditionals and subjunctives — they sound academic when spoken. "You open the app and it works" beats "If you were to open the app, you would find that it works."

Numbers: spell out when more natural phonetically ("twenty-seven" not "27", "three hundred" not "300"). Exception: years and precise measurements can stay numeric.

Acronyms: decide if they're spoken as letters (S-E-O) or words (NASA) and write accordingly. Be consistent within each script.

## Banned patterns
- Walls of text with no paragraph breaks
- Sentences longer than 20 words
- Passive voice unless intentionally dramatic
- Cliché openings: "In a world where...", "Imagine if...", "What if I told you..."
- Stacking three or more adjectives before a noun

## Banned vocabulary
Never use: unlock, empower, seamless, revolutionary, game-changer, robust, leverage, holistic, supercharge, next-level, cutting-edge, innovative, state-of-the-art, one-stop, all-in-one.

In Romanian also avoid: revoluționar, inovator, complet, unic, de top, fără efort, la un singur click.

## Language
Match the language of the BRIEF field exactly. If the brief is in Romanian, write in Romanian. If in English, write in English.`;

export function runVoScript(
  context: WorkspaceContext,
  input: VoScriptInput,
  callStream: StreamFn = callClaudeStream
) {
  const brandContext = buildContextPacket(context);
  const wordRange = getWordRange(input);
  const paceLabel = paceWordsPerSecond[input.pace].label;

  const directionNote = input.include_direction
    ? `\nINCLUDE DIRECTION NOTES: Yes — add parenthetical audio direction cues where appropriate: (pause), (emphasis), (slow), (crescendo), (softer), (beat). Place these on their own line before the relevant text. Do not overuse — max 4-6 per variant.`
    : `\nINCLUDE DIRECTION NOTES: No — output clean script text only, no parenthetical cues.`;

  const userPrompt = `Write a voiceover script for the following brief.
${brandContext ? `\nBRAND CONTEXT:\n${brandContext}\n` : ""}
FORMAT: ${formatGuidance[input.format]}
PACE: ${paceLabel} (${paceWordsPerSecond[input.pace].min}–${paceWordsPerSecond[input.pace].max} words per second)
${goalContext[input.goal]}
TARGET DURATION: ${wordRange.seconds} seconds
TARGET WORD COUNT: ${wordRange.min}–${wordRange.max} words
${directionNote}

CURRENT DATE: ${currentDate()} — use this for any time-sensitive references.

BRIEF: ${input.topic}

---

CRITICAL: Write all output in the same language as the BRIEF above.

Generate 3 variants with DIFFERENT NARRATIVE ANGLES — not just rephrasings. Each should take a genuinely distinct approach to the same brief. One might lead with emotion, one with evidence, one with a provocative question. Label each with its narrative angle.

After each variant, display:
- Word count (actual)
- Estimated duration at ${paceLabel} pace
- ✓ if within target range (${wordRange.min}–${wordRange.max} words), or ⚠️ OVER/SHORT if outside

Format:

**Variant 1 — [narrative angle]**

[VO script text with paragraph breaks as breath pauses]

📊 [X] words · ~[Y]s at ${paceLabel.toLowerCase()} pace [✓ or ⚠️]

---

**Variant 2 — [narrative angle]**

[VO script text]

📊 [X] words · ~[Y]s at ${paceLabel.toLowerCase()} pace [✓ or ⚠️]

---

**Variant 3 — [narrative angle]**

[VO script text]

📊 [X] words · ~[Y]s at ${paceLabel.toLowerCase()} pace [✓ or ⚠️]

No preamble. No explanations after. Just the three variants.`;

  return callStream(SYSTEM_PROMPT, userPrompt);
}
