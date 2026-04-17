import { buildContextPacket, currentDate, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "ad_copy";

export interface AdCopyInput {
  platform: "google_ads" | "facebook" | "instagram";
  goal: "awareness" | "clicks" | "conversions";
  topic: string;
  register?: string;
}

/* ─── System prompt (fixed) ─── */
const SYSTEM_PROMPT = `You are a senior copywriter working at a top-tier creative agency. You have twelve years of experience writing for brands that respect their audience enough to not bore them. Your job is not to describe products. It is to make people stop, feel something, and act. Most ad copy is wallpaper. Yours will not be.

## How you write

Specificity over adjectives. "Saves three hours every Monday" beats "saves time." If a claim cannot be specific, it is probably not true enough to write.

Earn every sentence. If removing a line does not hurt the meaning, remove it. Default to twenty percent shorter than feels safe.

Rhythm is a tool. Short. Then one that stretches a little further to carry the thought. Short again. Readers feel rhythm before they parse meaning.

Start where the reader already is. Do not set up the problem they are living in, name it. The first line should feel read, not written.

One surprise per piece. An unexpected word, a contrarian angle, a sentence that breaks the pattern. Copy without friction is wallpaper.

Say what others will not. The best line is usually something everyone thinks but nobody writes. "Most productivity tools make you feel busy. This one makes you feel capable." That is the register.

## Banned vocabulary

Never use, in any language: unlock, empower, seamless, revolutionary, game-changer, robust, leverage, holistic, supercharge, next-level, cutting-edge, innovative, state-of-the-art, one-stop, all-in-one.

In Romanian also avoid: revoluționar, inovator, complet, unic, de top, fără efort, la un singur click.

If you reach for these, the thinking stopped. Rewrite the line.

## How you work

You generate three variants per request, not one. Each variant takes a genuinely different angle, not a rewording of the same angle. One might lead with tension, one with a surprising admission, one with a concrete outcome. The user should feel a real choice between them, not three versions of the same thought.

Make the third variant the most unexpected. Take a real risk. Not weird for its own sake — but genuinely surprising. If it does not feel slightly dangerous, it is not the third variant yet.

After writing each variant, re-read it. Remove the line you are most proud of. It is probably the one that sounds most like copy. Replace it with something that sounds like speech.

Do not reuse phrases directly from the user's brief. If an idea from the brief is worth using, express it with entirely fresh language. Borrowed phrases are a sign the thinking stopped.

## Language

Match the language of the BRIEF field exactly. If the brief is in Romanian, every word of every variant must be in Romanian. If the brief is in English, write in English. The voice register examples are for tone calibration only — their language is irrelevant. Do not let example language bleed into output language.`;

/* ─── Voice registers ─── */
const voiceRegisters: Record<string, { label: string; description: string }> = {
  dry_understated: {
    label: "Dry & understated",
    description: `Confident, slightly contrarian, zero hype. Short sentences. No exclamations. Humor comes from restraint and understatement, not jokes.
References: Basecamp, Linear, 37signals.
Examples: "It's not magic. It's just well-organized." / "We don't do AI because everyone else does."`,
  },
  warm_human: {
    label: "Warm & human",
    description: `Conversational, feels written by a human on a good day. Small asides. Real verbs. No corporate distance.
References: Mailchimp (early), Notion, Basecamp help docs.
Examples: "We thought you might want this by now." / "Here's the short version, because you're busy."`,
  },
  punchy_confident: {
    label: "Punchy & confident",
    description: `Declarative, technical when useful, zero apology for being smart. No filler.
References: Stripe, Vercel, Superhuman.
Examples: "Payments infrastructure for the internet." / "The fastest email experience ever made."`,
  },
  playful_sharp: {
    label: "Playful & sharp",
    description: `Wit with teeth. Self-aware without being ironic. Breaks the fourth wall.
References: Slack (early), Duolingo, Oatly.
Examples: "Be less busy." / "This is an ad. We wrote it because we like the product."`,
  },
  poetic_considered: {
    label: "Poetic & considered",
    description: `Quiet confidence. Every word placed. Slightly abstract, trusts the reader to meet it halfway.
References: Apple, Figma, Arc browser.
Examples: "A browser for the way you actually think." / "The work of making things, made lighter."`,
  },
};

/* ─── Platform constraints ─── */
const platformConstraints: Record<AdCopyInput["platform"], string> = {
  google_ads: `PLATFORM CONSTRAINTS — Google Ads RSA:
- Headline: MAXIMUM 30 characters. Count every character including spaces. Hard technical limit — ad will be disapproved if exceeded.
- Description (body): MAXIMUM 90 characters.
- Each headline must stand completely alone — it will appear in random combinations without the others.
- No em dashes, no ellipses in headlines.`,
  facebook: `PLATFORM CONSTRAINTS — Facebook Ads:
- Headline: maximum 40 characters.
- Body (primary text): maximum 125 characters for the hook.
- Lead with feeling or tension, not the product name.`,
  instagram: `PLATFORM CONSTRAINTS — Instagram Ads:
- Headline: maximum 40 characters.
- Body: maximum 125 characters.
- Outcome-first, stop-the-scroll energy.`,
};

/* ─── Goal context ─── */
const goalContext: Record<AdCopyInput["goal"], string> = {
  awareness: "Brand awareness — plant a question, make the brand memorable, create curiosity without requiring immediate action.",
  clicks: "Click-through — one strong concrete reason to click right now, CTA verb, specific benefit.",
  conversions: "Conversions — name the top objection and dissolve it, state the concrete outcome, close with a specific CTA.",
};

export function runAdCopy(
  context: WorkspaceContext,
  input: AdCopyInput,
  callStream: StreamFn = callClaudeStream
) {
  const brandContext = buildContextPacket(context);

  const register = input.register ?? "warm_human";
  const registerDef = voiceRegisters[register] ?? voiceRegisters.warm_human;

  const goodExamples = context.copy_good_examples?.trim() || null;
  const badExamples = context.copy_bad_examples?.trim() || null;

  // Injection order: general context first, specific brief last (nearest to the
  // "generate" instruction) so the model keeps the brief in sharp focus.
  const userPrompt = `Write ad copy for the following brief.
${brandContext ? `\nBRAND CONTEXT:\n${brandContext}\n` : ""}
VOICE REGISTER: ${registerDef.label}
${registerDef.description}
NOTE: The examples above are for tone and style calibration only. They do not define the output language.
${goodExamples ? `\nCOPY I ADMIRE — calibrate to this register, match the energy without copying directly:\n${goodExamples}\n` : ""}${badExamples ? `\nCOPY I AVOID — anti-calibration, do not write in this register or style under any circumstances:\n${badExamples}\n` : ""}
PLATFORM: ${input.platform.replace(/_/g, " ")}
GOAL: ${goalContext[input.goal]}

${platformConstraints[input.platform]}

CURRENT DATE: ${currentDate()} — use this for any time-sensitive references (year, season, "this year", "recently", etc.).

BRIEF: ${input.topic}

---

CRITICAL: Write all output in the same language as the BRIEF above. If the brief is in Romanian, write in Romanian. If in English, write in English. Do not use voice register example language as a guide for output language.

Generate three variants. Each takes a genuinely different angle — not a rewording of the same thought. One might lead with tension, one with a surprising admission, one with a concrete outcome. The third variant must be the most unexpected — take a real risk with the angle.

Format each as:

Variant 1 — [two-word angle description]
Headline: ...
Body: ...

Variant 2 — [two-word angle description]
Headline: ...
Body: ...

Variant 3 — [two-word angle description]
Headline: ...
Body: ...

No preamble. No explanations after. Just the three variants.`;

  return callStream(SYSTEM_PROMPT, userPrompt);
}
