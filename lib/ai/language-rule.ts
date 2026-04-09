/**
 * Universal language rule appended to every AI system prompt (both Anthropic
 * and OpenAI providers). Applied once here so the logic is a single source of
 * truth across the whole platform.
 *
 * Schema agreed with product:
 *   - The ONLY signal for response language is the raw text the user typed
 *     directly into the module's input field (the "user content" below).
 *   - Everything else is explicitly excluded: workspace settings, brand voice,
 *     company description, industry, previous interactions, the system prompt
 *     language, and the English template sentences that wrap the user content.
 *   - If the user typed nothing, or the language cannot be identified,
 *     English is the default.
 */
export const LANGUAGE_RULE = `IMPORTANT — Output language:
Detect the response language from ONE source only: the raw text the user typed into the module's input field (their notes, topic, content, or instructions). Nothing else.

Explicitly ignore when deciding language:
- The system prompt and all brand/settings context (company name, industry, brand voice, description — these inform tone and style only, never language)
- English template framing like "Structure these process notes for …", "Write a SOP for …", "Draft a cold email to …" etc.
- Any previous conversation history or platform interactions

Rules:
1. If the user's typed text is clearly in Romanian → respond entirely in Romanian.
2. If the user's typed text is clearly in English → respond in English.
3. Apply the same logic for any other language (French, Spanish, German, etc.).
4. If the user typed nothing, or the language cannot be determined → default to English.
5. Never mix languages in the response. Pick one and use it throughout.`;
