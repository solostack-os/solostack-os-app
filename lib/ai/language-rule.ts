/**
 * Universal language rule appended to every AI system prompt.
 *
 * User prompts are wrapped in English template sentences (e.g. "Structure
 * these process notes for 'X':\n\n<user content>"). Without this rule the
 * model can pick up the English framing and reply in English even when the
 * user's own content is in another language (e.g. Romanian).
 *
 * The fix: detect language from the USER'S CONTENT, not the template.
 */
export const LANGUAGE_RULE = `IMPORTANT — Output language rules:
1. Your response language must match the language of the USER'S INPUT CONTENT — that is, the notes, text, topic, or other material the user provided, not the template sentence that introduces it (e.g. ignore "Structure these process notes for …" or "Write a SOP for …").
2. NEVER use the system prompt language for language detection. Brand context, company descriptions, and voice notes may be in any language — they are purely for tone and style.
3. If the user's content is in Romanian → respond entirely in Romanian. If in English → respond in English. Match the dominant language of the input content.
4. When the user's content is a mix of languages, default to the language that makes up the majority of the text.`;
