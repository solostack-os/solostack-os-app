import { buildContextPacket, currentDate, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "ad_copy";

export interface AdCopyInput {
  platform: "google_ads" | "facebook" | "instagram";
  goal: "awareness" | "clicks" | "conversions";
  topic: string;
  register?: string;
  /** Facebook only — "ad" (default) or "organic" */
  fb_mode?: "ad" | "organic";
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

/* ─── Goal context ─── */
const goalContext: Record<AdCopyInput["goal"], string> = {
  awareness: "Brand awareness — plant a question, make the brand memorable, create curiosity without requiring immediate action.",
  clicks: "Click-through — one strong concrete reason to click right now, CTA verb, specific benefit.",
  conversions: "Conversions — name the top objection and dissolve it, state the concrete outcome, close with a specific CTA.",
};

/* ─── Shared preamble builder ─── */
function buildPreamble(
  brandContext: string,
  registerDef: { label: string; description: string },
  goodExamples: string | null,
  badExamples: string | null,
  goal: AdCopyInput["goal"],
  topic: string,
): string {
  return `${brandContext ? `BRAND CONTEXT:\n${brandContext}\n\n` : ""}VOICE REGISTER: ${registerDef.label}
${registerDef.description}
NOTE: The examples above are for tone and style calibration only. They do not define the output language.
${goodExamples ? `\nPOSITIVE STYLISTIC ANCHORS — emulate the register, structure, and tone of these examples:\n${goodExamples}\n` : ""}${badExamples ? `\nNEGATIVE ANTI-PATTERNS — actively steer away from this register, vocabulary, and structure:\n${badExamples}\n` : ""}
GOAL: ${goalContext[goal]}

CURRENT DATE: ${currentDate()} — use this for any time-sensitive references (year, season, "this year", "recently", etc.).

BRIEF: ${topic}

---

CRITICAL: Write all output in the same language as the BRIEF above. If the brief is in Romanian, write in Romanian. If in English, write in English. Do not use voice register example language as a guide for output language.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Google Ads RSA — 15 headlines + 4 descriptions
   ═══════════════════════════════════════════════════════════════════════════ */
function buildGoogleAdsPrompt(
  preamble: string,
): string {
  return `Generate a complete Google Ads Responsive Search Ad (RSA) asset set for the following brief.

${preamble}

PLATFORM: Google Ads — Responsive Search Ad (RSA)

## RSA FORMAT REQUIREMENTS

Google Ads RSA combines headlines and descriptions in random pairs. Each line must work independently AND in any combination.

You must produce exactly:
- 15 headlines: MAXIMUM 30 characters each (including spaces). This is a hard technical limit — the ad will be disapproved if exceeded.
- 4 descriptions: MAXIMUM 90 characters each (including spaces).

After each line, display the character count in square brackets, e.g. [28/30] or [85/90].
If any line exceeds its limit, prefix it with ⚠️ and show [33/30 — OVER].

## HEADLINE RULES
- Each headline must stand completely alone — it appears in random combinations.
- No em dashes, no ellipses.
- Mix of: benefit-driven, feature-specific, urgency/CTA, brand/trust, and curiosity headlines.
- Do NOT repeat the same idea across headlines — each must bring a distinct angle or proof point.
- At least 3 headlines should contain a specific number, stat, or concrete detail.

## DESCRIPTION RULES
- Each description expands on a different angle (benefit, proof, urgency, differentiator).
- Include a clear CTA verb in at least 2 descriptions.
- Descriptions will be paired with random headlines — do not reference specific headlines.

## OUTPUT FORMAT

**Headlines**
H1. [headline text] [char/30]
H2. [headline text] [char/30]
H3. [headline text] [char/30]
H4. [headline text] [char/30]
H5. [headline text] [char/30]
H6. [headline text] [char/30]
H7. [headline text] [char/30]
H8. [headline text] [char/30]
H9. [headline text] [char/30]
H10. [headline text] [char/30]
H11. [headline text] [char/30]
H12. [headline text] [char/30]
H13. [headline text] [char/30]
H14. [headline text] [char/30]
H15. [headline text] [char/30]

**Descriptions**
D1. [description text] [char/90]
D2. [description text] [char/90]
D3. [description text] [char/90]
D4. [description text] [char/90]

No preamble. No explanations. Just the headlines and descriptions in the exact format above.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Facebook Ad — 3 angle-labeled variations
   ═══════════════════════════════════════════════════════════════════════════ */
function buildFacebookAdPrompt(
  preamble: string,
): string {
  return `Write Facebook Ad copy for the following brief.

${preamble}

PLATFORM: Facebook — Paid Ad

## FACEBOOK AD FORMAT REQUIREMENTS

Each variation must contain:
- **Primary text**: The main copy that appears above the image/video. Recommend keeping the hook within the first 125 characters (before the "See more" fold). Can extend beyond 125 for the full text.
- **Headline**: Maximum 40 characters. Appears below the image — bold, high impact.
- **Description**: Maximum 30 characters. Appears below the headline — supporting context or CTA.

After each constrained element, show the character count: [char/limit].

## ANGLE REQUIREMENTS

Generate 3 variations. Each must use a genuinely DIFFERENT narrative angle — not a rewording. Label each with its narrative approach.

Suggested angle types (pick 3 that fit the brief — do NOT use all of these):
- Insight-led: Opens with a surprising truth or counterintuitive observation
- Aphorism-led: Opens with a memorable, quotable statement
- Question-led: Opens with a question that names the reader's exact situation
- Tension-led: Opens with a friction point or frustration the reader recognizes
- Outcome-led: Opens with the concrete result, then works backward
- Story-led: Opens with a micro-narrative or scenario

The third variation should be the most unexpected angle.

## OUTPUT FORMAT

Variation 1 — [Narrative angle name]
Primary text: [full primary text]
Headline: [headline] [char/40]
Description: [description] [char/30]

---

Variation 2 — [Narrative angle name]
Primary text: [full primary text]
Headline: [headline] [char/40]
Description: [description] [char/30]

---

Variation 3 — [Narrative angle name]
Primary text: [full primary text]
Headline: [headline] [char/40]
Description: [description] [char/30]

No preamble. No explanations after. Just the three variations.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Facebook Organic Post — free-form engagement copy
   ═══════════════════════════════════════════════════════════════════════════ */
function buildFacebookOrganicPrompt(
  preamble: string,
): string {
  return `Write a Facebook organic post for the following brief.

${preamble}

PLATFORM: Facebook — Organic Post

## ORGANIC POST GUIDELINES

This is NOT an ad. No character constraints. Optimize for engagement: comments, shares, saves.

Write 3 variations, each with a genuinely different narrative approach:
- Hook within the first 2 lines (before "See more" fold)
- Natural paragraph breaks — not a wall of text
- End with a conversation-starter (question, prompt, or open loop) — NOT a sales CTA
- No hashtags unless the brief specifically requests them

Label each with its narrative angle (e.g., "Insight-led", "Story-led", "Question-led").
The third variation should take the most unexpected angle.

Do not reuse phrases from the brief. If an idea is worth using, express it with fresh language.

After writing each post, re-read it. Remove the line you are most proud of. It probably sounds like marketing. Replace it with something that sounds like speech.

## OUTPUT FORMAT

Variation 1 — [Narrative angle name]
[full post text]

---

Variation 2 — [Narrative angle name]
[full post text]

---

Variation 3 — [Narrative angle name]
[full post text]

No preamble. No explanations after. Just the three variations.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Instagram — 3 variations (Feed / Stories / Reels) + hashtags
   ═══════════════════════════════════════════════════════════════════════════ */
function buildInstagramPrompt(
  preamble: string,
): string {
  return `Write Instagram ad copy for the following brief.

${preamble}

PLATFORM: Instagram

## INSTAGRAM FORMAT REQUIREMENTS

Generate 3 variations optimized for different Instagram placements. Each must use a genuinely different narrative angle.

### Variation 1 — Feed Post
- Caption: maximum 2200 characters total
- CRITICAL: The hook (first 125 characters before "...more") must stop the scroll. Front-load the most compelling line.
- Use paragraph breaks for readability
- End with a CTA appropriate for feed (save, share, comment, link in bio)

### Variation 2 — Stories
- Short, punchy text designed for story cards (1-3 cards worth of text)
- Each card: 1-2 sentences max. Think overlay text on an image.
- Include a swipe-up / link CTA or poll/question sticker suggestion
- Conversational, urgent, ephemeral tone

### Variation 3 — Reels
- Hook line (first 3 seconds / first sentence must grab)
- Caption that complements the visual, not duplicates it
- Optimized for discovery — trending angle, relatable take, or pattern interrupt
- End with a save/share prompt

After each variation, add the character count for the full caption: [char total].

## HASHTAGS

After all 3 variations, output a separate hashtag block:

**Suggested hashtags** (pick 5-10 relevant to the brief):
[hashtags, space-separated]

Mix of: 2-3 high-volume discovery tags, 3-4 niche/specific tags, 1-2 branded or community tags.

## OUTPUT FORMAT

Variation 1 — Feed: [narrative angle]
[caption text]
[char/2200]

---

Variation 2 — Stories: [narrative angle]
[card-by-card text]

---

Variation 3 — Reels: [narrative angle]
[hook + caption text]

---

**Suggested hashtags**
[hashtags]

No preamble. No explanations after.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main export
   ═══════════════════════════════════════════════════════════════════════════ */
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

  const preamble = buildPreamble(
    brandContext,
    registerDef,
    goodExamples,
    badExamples,
    input.goal,
    input.topic,
  );

  let userPrompt: string;
  if (input.platform === "google_ads") {
    userPrompt = buildGoogleAdsPrompt(preamble);
  } else if (input.platform === "facebook") {
    if (input.fb_mode === "organic") {
      userPrompt = buildFacebookOrganicPrompt(preamble);
    } else {
      userPrompt = buildFacebookAdPrompt(preamble);
    }
  } else {
    userPrompt = buildInstagramPrompt(preamble);
  }

  return callStream(SYSTEM_PROMPT, userPrompt);
}
