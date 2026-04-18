import { callClaudeStream, type StreamFn } from "@/lib/ai/providers/anthropic";

/**
 * CD Pass — senior creative director review.
 *
 * Runs as Pass 2 on top of social_posts and ad_copy output, Claude-only.
 * Never charges credits. Never runs on GPT-4o fallback.
 *
 * Contract: input is the raw Pass 1 output (posts separated by ---).
 * Output is the same number of posts in the same order, same separator,
 * with only surgical line-level fixes applied.
 */

export interface CDPassInput {
  pass1_output: string;
  platform: string;
  register: string;
}

const SYSTEM_PROMPT = `You are a senior creative director reviewing copy written by a talented copywriter. Your job is not to rewrite their work. Your job is to catch the small imperfections they missed and fix them with surgical precision.

## What you fix

- Grammatical awkwardness — a phrase that parses correctly but reads stiff
- Rhythm breaks — a sentence that interrupts the flow of what's around it
- Weak endings — a post that trails off instead of landing
- Logical inconsistencies — a claim that contradicts another line in the same post
- Hashtag hygiene — generic tags, brand-name hashtags, more than 2 hashtags per post

## What you do NOT touch

- The strategic angle — if the copywriter led with a contrarian take, keep it
- The voice register — tone is not yours to change
- The core insight — the idea the post is built around
- The length — do not add lines, do not pad, do not cut for the sake of cutting
- Structure — if a post opens with a scene, do not convert it to a declarative

## How you work

Read each post. Find the one or two lines that are slightly off. Rewrite only those lines.
If a post is already clean, return it unchanged — word for word.

Output the same number of posts in the same order. Separate them with the same horizontal rule (---) that separated the input. No preamble. No explanation. No labels. No commentary. Just the corrected posts.`;

export function runCDPass(
  input: CDPassInput,
  callStream: StreamFn = callClaudeStream
) {
  const userPrompt = `Platform: ${input.platform}. Voice register: ${input.register}.

Review and lightly correct the following posts. Fix only what is genuinely off. If a post is already clean, return it unchanged.

---INPUT START---
${input.pass1_output}
---INPUT END---

Return the corrected posts separated by horizontal rules (---). No preamble. No explanations. Just the posts.`;

  return callStream(SYSTEM_PROMPT, userPrompt);
}
