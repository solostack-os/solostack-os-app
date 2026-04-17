import { buildContextPacket, type WorkspaceContext } from "@/lib/ai/context-packet";
import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

export const WORKFLOW_KEY = "ad_copy";

export interface AdCopyInput {
  platform: "google_ads" | "facebook" | "instagram";
  goal: "awareness" | "clicks" | "conversions";
  topic: string;
}

const platformConstraints: Record<AdCopyInput["platform"], string> = {
  google_ads: `Google Ads RSA (Responsive Search Ad) format.
HARD character limits — the ad will be DISAPPROVED if exceeded:
- Headline: MAXIMUM 30 characters (including spaces and punctuation). Count carefully.
- Description (body): MAXIMUM 90 characters (including spaces and punctuation).

RSA rules:
- Each headline must stand completely alone — it will be shown without the others in random combinations. Never write a headline that requires another headline to make sense.
- No em dashes (—), ellipses, or exclamation marks in headlines — they risk disapproval.
- Do NOT start every headline with the brand name.
- Good 30-char headline examples: "Start Free — No Credit Card" (28), "All-in-One Business Tools" (25), "Launch Your MVP in Days" (22).`,
  facebook:
    "Facebook Ads format. Each headline MUST be 40 characters or fewer. Each body MUST be 125 characters or fewer. Conversational, thumb-stopping tone. Lead with the problem or desire, not the product name.",
  instagram:
    "Instagram Ads format. Each headline MUST be 40 characters or fewer. Each body MUST be 125 characters or fewer. Visual, aspirational, scroll-stopping tone. Paint a picture of the outcome, then name the product.",
};

const goalGuidance: Record<AdCopyInput["goal"], string> = {
  awareness:
    "Optimise for brand awareness — focus on memorability, curiosity, and emotional resonance. Headlines should plant a question or create intrigue. Bodies should open a loop the audience wants to close.",
  clicks:
    "Optimise for click-through — lead with a specific, concrete benefit. Use a CTA verb in at least one headline (Get, See, Discover). Bodies should give one strong reason to click right now.",
  conversions:
    `Optimise for conversions — this is the highest-intent goal. Every word must earn its place.
- Headlines: mix a CTA (Try, Start, Get), a specific outcome or number, and an objection-killer (Free Trial, No Setup, Cancel Anytime).
- Bodies: open with the #1 objection the product removes, state the concrete outcome, close with a specific CTA.
- Use concrete specifics over vague claims. Write "Launch in 1 day" not "Launch faster". Write "No code required" not "Easy to use".
- Avoid unverifiable social proof like "thousands of users" unless the topic explicitly states a real number.`,
};

export function runAdCopy(
  context: WorkspaceContext,
  input: AdCopyInput,
  callStream: StreamFn = callClaudeStream
) {
  const brandContext = buildContextPacket(context);
  const brandPrefix = brandContext ? `${brandContext}\n\n` : "";

  const isGoogleAds = input.platform === "google_ads";

  const systemPrompt = `${brandPrefix}You are an expert performance-marketing copywriter specialising in paid ads. You write copy that converts while respecting every platform constraint.

${platformConstraints[input.platform]}

Goal: ${goalGuidance[input.goal]}

Output rules:
- Write exactly 3 ad variations.
- Each variation must contain a "Headline:" line and a "Body:" line.
- Separate each variation with a horizontal rule (---).${isGoogleAds ? `
- After writing each headline, silently count its characters. If it is over 30, shorten it before outputting. Never output a headline over 30 characters.` : ""}
- Output only the ad variations. No preamble, no explanation, no numbering like "Variation 1:".`;

  const userPrompt = `Write 3 ad variations about: ${input.topic}`;

  return callStream(systemPrompt, userPrompt);
}
