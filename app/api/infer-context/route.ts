import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callClaude } from "@/lib/ai/providers/anthropic";

const SYSTEM_PROMPT = `You are helping infer a provisional business context from user-provided information about their business.

Your job is to identify the BUSINESS behind the input — not describe a webpage, URL, or internet presence.

Return JSON only with:
{
  "audience": "...",
  "offer": "...",
  "outcome": "...",
  "description": "...",
  "business_type": "...",
  "company_name": "...",
  "confidence": "low|medium|high"
}

Rules:
- Infer the business behind the content, not the function of a webpage.
- "audience" = the actual customers or clients this business serves. Prefer concrete categories: businesses, brands, retailers, founders, consultants, clinics, agencies, authors, creators, etc. NEVER use generic audiences like "internet users", "website visitors", "potential clients", or "people online" unless the business is explicitly a web traffic / analytics / conversion product.
- "offer" = the actual service, product, or value the business provides. Prefer concrete offers: advertising production, visual identity, consulting, marketing operations, design services, software platform, coaching, etc. NEVER say "services/products sold via [domain] website" — describe the actual service.
- "outcome" = the real business result the customer gets. This field completes the sentence "so they can ___" — it MUST start with an active verb (e.g., "build", "produce", "maintain", "achieve", "deliver", "create", "reach", "avoid"). Do NOT return a bare noun phrase. Correct: "build a cohesive brand presence", "produce consistent on-brand outputs". Incorrect: "a cohesive brand presence", "structured outputs", "better marketing". NEVER default to "attract visitors and convert them into customers" unless the business specifically sells website conversion, CRO, ads, or digital marketing.
- "description" = a 1-2 sentence plain summary of what this business does. Write it as a neutral fact, not marketing copy.
- "business_type" = the category of business (e.g. "SaaS", "agency", "consultancy", "e-commerce", "freelance", "clinic", "studio"). One or two words max.
- "company_name" = the brand or company name. For page titles like "SoloStack OS — AI Operating System", extract only the brand part (before the em-dash, pipe, or colon). Set to null if uncertain.
- Do not invent specifics that are not reasonably implied.
- Keep each field short and plain (under 15 words each, except description which can be 1-2 sentences).
- If a field cannot be inferred with reasonable confidence, set it to null.
- If the overall input is ambiguous, set confidence to "low".
- Do not write marketing copy.
- Do not include explanations.
- Return ONLY the JSON object, no markdown, no code blocks.`;

/**
 * Detect whether a string looks like a URL.
 */
function looksLikeUrl(input: string): boolean {
  // Starts with http(s):// or looks like a domain (word.tld)
  return /^https?:\/\//i.test(input) || /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.[a-z]{2,}/i.test(input);
}

/**
 * Normalise a URL — add https:// if missing.
 */
function normaliseUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
}

interface PageSignals {
  url: string;
  title: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  headings: string[];
  snippets: string[];
}

/**
 * Block localhost, private IPs, and link-local addresses.
 */
function isPrivateUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0|::1|\[::1\]|fe80)/i.test(hostname);
  } catch {
    return true;
  }
}

/**
 * Fetch a URL and extract lightweight page signals using regex.
 * Safety: 5s timeout, 100KB limit, block private IPs, only accept 200.
 */
async function extractPageSignals(url: string): Promise<PageSignals | null> {
  if (isPrivateUrl(url)) return null;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SoloStackBot/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });

    if (res.status !== 200) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();
    // Limit processing to first 100KB
    const chunk = html.slice(0, 100_000);

    const title = chunk.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || null;
    const metaDescription = chunk.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1]?.trim()
      || chunk.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)?.[1]?.trim()
      || null;
    const ogTitle = chunk.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)?.[1]?.trim()
      || chunk.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i)?.[1]?.trim()
      || null;
    const ogDescription = chunk.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)?.[1]?.trim()
      || chunk.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i)?.[1]?.trim()
      || null;

    // Extract h1 and h2 headings (up to 8)
    const headings: string[] = [];
    const hRe = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi;
    let hMatch: RegExpExecArray | null;
    while ((hMatch = hRe.exec(chunk)) !== null && headings.length < 8) {
      const text = hMatch[1].replace(/<[^>]*>/g, "").trim();
      if (text.length > 0 && text.length < 200) headings.push(text);
    }

    // Extract first few paragraph snippets (up to 4, max 200 chars each)
    const snippets: string[] = [];
    const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch: RegExpExecArray | null;
    while ((pMatch = pRe.exec(chunk)) !== null && snippets.length < 4) {
      const text = pMatch[1].replace(/<[^>]*>/g, "").trim();
      if (text.length > 20 && text.length < 500) snippets.push(text.slice(0, 200));
    }

    return { url, title, metaDescription, ogTitle, ogDescription, headings, snippets };
  } catch {
    return null;
  }
}

/**
 * Build a text summary of page signals for the inference prompt.
 */
function formatSignals(signals: PageSignals): string {
  const lines: string[] = [`Website: ${signals.url}`];
  if (signals.title) lines.push(`Page title: ${signals.title}`);
  if (signals.ogTitle && signals.ogTitle !== signals.title) lines.push(`OG title: ${signals.ogTitle}`);
  if (signals.metaDescription) lines.push(`Meta description: ${signals.metaDescription}`);
  if (signals.ogDescription && signals.ogDescription !== signals.metaDescription) lines.push(`OG description: ${signals.ogDescription}`);
  if (signals.headings.length > 0) lines.push(`Headings: ${signals.headings.join(" | ")}`);
  if (signals.snippets.length > 0) lines.push(`Page snippets:\n${signals.snippets.map(s => `- ${s}`).join("\n")}`);
  return lines.join("\n");
}

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

    // If input looks like a URL, fetch and extract page signals
    let userInput: string;
    if (looksLikeUrl(description)) {
      const url = normaliseUrl(description);
      const signals = await extractPageSignals(url);

      if (signals) {
        // Dev-only logging of extracted signals
        if (process.env.NODE_ENV === "development") {
          console.log("[infer-context] Extracted page signals:", JSON.stringify(signals, null, 2));
        }
        userInput = `The user provided a website URL. Here is what I extracted from the page:\n\n${formatSignals(signals)}\n\nBased on this, infer what business this is, who their customers are, what they offer, and what outcome they deliver.`;
      } else {
        // Fetch failed — use the URL as-is
        userInput = `The user provided a URL: ${description}\nI could not fetch the page. Based on the domain name alone, make a conservative inference about what business this might be. Set confidence to "low".`;
      }
    } else {
      userInput = `The user describes their business as:\n${description}`;
    }

    const result = await callClaude(
      SYSTEM_PROMPT,
      userInput,
    );

    // Strip markdown code fences if the model wraps the JSON
    let cleaned = result.text.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      audience: String(parsed.audience || "").slice(0, 200),
      offer: String(parsed.offer || "").slice(0, 200),
      outcome: String(parsed.outcome || "").slice(0, 200),
      description: parsed.description ? String(parsed.description).slice(0, 500) : null,
      business_type: parsed.business_type ? String(parsed.business_type).slice(0, 100) : null,
      company_name: parsed.company_name ? String(parsed.company_name).slice(0, 200) : null,
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
      description: null,
      business_type: null,
      company_name: null,
      confidence: "low" as const,
    });
  }
}
