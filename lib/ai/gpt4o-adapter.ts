import { callOpenAIStream } from "@/lib/ai/providers/openai";
import type { StreamFn } from "@/lib/ai/providers/anthropic";

/**
 * GPT-4o copywriting adapter.
 *
 * GPT-4o has well-documented biases that conflict with the copywriting system:
 * it defaults toward banned vocabulary (even in Romanian), produces structurally
 * similar variants, mixes languages inside posts, and tends toward "brand account"
 * softening at the end. This addendum is injected into the system prompt whenever
 * the OpenAI fallback is active for copy-generating workflows.
 *
 * It is NOT injected on Anthropic — Claude handles the base prompt correctly.
 */
export const GPT4O_COPYWRITING_ADDENDUM = `
---
ADDITIONAL CONSTRAINTS — STRICTLY ENFORCED FOR THIS RUN:

## Banned vocabulary — extended Romanian list

Re-read every post before output. Replace any instance of the following, including
all near-synonyms and semantic equivalents:

English (already banned): unlock, empower, seamless, revolutionary, game-changer,
robust, leverage, holistic, supercharge, next-level, cutting-edge, innovative,
state-of-the-art, one-stop, all-in-one.

Romanian equivalents — also banned:
- fără cusături, fără fricțiuni, fără întreruperi (= seamless)
- împuternicește, capacitează, te pune în control (= empower)
- cu ușurință, simplu ca nimic, fără niciun efort, fără efort (= effortless)
- ultimă generație, de ultimă oră, la zi cu tehnologia (= cutting-edge / state-of-the-art)
- schimbă regulile jocului, schimbă paradigma, schimbă totul (= game-changer)
- valorifică, capitalizează pe, profită la maximum (= leverage)
- holistic, integrat în sensul de "tot ce ai nevoie" (= holistic)
- deblochează, eliberează potențialul, deschide calea (= unlock)
- transformativ, transformator, transformă totul (= transformative)
- disruptiv (= disruptive)
- revoluție, revoluționar, inovator, complet, unic, de top, la un singur click (already banned, re-enforced)

If you reach for any of these, the thinking stopped. Find the specific, concrete
alternative — the actual outcome, the real mechanism, the precise moment.

## Structural variety across posts

Each post MUST open with a structurally different rhetorical device. Choose 3 from
this list, no repeats across posts in the same set:

- Declarative statement (bold, direct claim)
- Admission or confession ("We got this wrong for years.")
- Specific scene or moment ("Tuesday morning, 8am. The client emails us.")
- Contrarian take ("Everyone says X. They're wrong.")
- Specific data point or before/after ("We cut response time by half. In one week.")
- Rhetorical question (only one post per set may use this)

Do not decide on structure after writing — decide first, then write to that structure.

## No code-switching inside posts

Pick one language per post and use it throughout. Do not mix Romanian and English
inside a single post. This means: no "one-person show-ul nostru", no "brand
awareness-ul", no "target audience-ul", no "call to action". Find the Romanian
equivalent or rewrite the sentence without it.

## No brand account voice

Do not end posts with generic engagement phrases. Banned endings include:
- "Așteptăm gândurile voastre" / "Așteptăm părerile voastre"
- "Ce crezi?" / "Ești de acord?" / "Tu ce zici?"
- "Let us know what you think" (in any language)
- Emoji used as emotional softening at the end (☕, 👀, 💡, 🚀, etc.)
- "Spune-ne în comentarii"

If the post needs a closing move, make it a specific question tied to the brief's
content, or end on a declarative line that needs no response.
`;

/**
 * Drop-in replacement for callClaudeStream on copy-generating workflows when
 * the OpenAI fallback is active. Appends the adapter addendum to the system
 * prompt so GPT-4o output meets the same quality floor as Claude.
 */
export const callOpenAIStreamWithCopyAdapter: StreamFn = (
  systemPrompt: string,
  userPrompt: string
) => {
  return callOpenAIStream(systemPrompt + GPT4O_COPYWRITING_ADDENDUM, userPrompt);
};
