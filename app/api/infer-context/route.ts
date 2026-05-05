import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callClaude } from "@/lib/ai/providers/anthropic";

const SYSTEM_PROMPT = `You are helping infer a provisional business context from a short user description.

Return JSON only with:
{
  "audience": "...",
  "offer": "...",
  "outcome": "...",
  "confidence": "low|medium|high"
}

Rules:
- Do not invent specifics that are not reasonably implied.
- Keep each field short and plain (under 15 words each).
- If the input is vague, make the safest useful inference and set confidence to "low".
- Do not write marketing copy.
- Do not include explanations.
- Return ONLY the JSON object, no markdown, no code blocks.`;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const description = (body.description as string)?.trim();

    if (!description) {
      return NextResponse.json({
        audience: "",
        offer: "",
        outcome: "",
        confidence: "low" as const,
      });
    }

    const result = await callClaude(
      SYSTEM_PROMPT,
      `Input:\n${description}`,
    );

    // Strip markdown code fences if the model wraps the JSON
    let cleaned = result.text.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      audience: String(parsed.audience || "").slice(0, 200),
      offer: String(parsed.offer || "").slice(0, 200),
      outcome: String(parsed.outcome || "").slice(0, 200),
      confidence: ["low", "medium", "high"].includes(parsed.confidence)
        ? parsed.confidence
        : "low",
    });
  } catch {
    // On any failure, return empty fields — client falls back to manual editing
    return NextResponse.json({
      audience: "",
      offer: "",
      outcome: "",
      confidence: "low" as const,
    });
  }
}
