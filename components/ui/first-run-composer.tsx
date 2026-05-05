"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ─── Design tokens (matching dashboard) ─── */
const accent = "#6c8cff";
const accentLight = "#818cf8";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const surface = "#111827";
const border = "rgba(255,255,255,0.06)";

type ComposerState = "input" | "inferring" | "confirm" | "editing" | "generating" | "output";

interface InferredContext {
  audience: string;
  offer: string;
  outcome: string;
  description?: string | null;
  business_type?: string | null;
}

interface FirstRunComposerProps {
  workspaceId: string;
  /** Called when the user is done with the composer and wants to see the normal dashboard. */
  onDismiss?: () => void;
}

export function FirstRunComposer({ workspaceId, onDismiss }: FirstRunComposerProps) {
  const [state, setState] = useState<ComposerState>("input");

  // Input state
  const [freeformInput, setFreeformInput] = useState("");

  // Inferred / editing context
  const [ctx, setCtx] = useState<InferredContext>({ audience: "", offer: "", outcome: "" });

  // Generation state
  const [outputText, setOutputText] = useState("");
  const [genError, setGenError] = useState<string | null>(null);
  const streamRef = useRef<HTMLDivElement | null>(null);

  // Saved fields tracking (for inline confirmation)
  const [savedFields, setSavedFields] = useState<string[]>([]);

  // Refinement CTA state
  const [refinementValue, setRefinementValue] = useState("");
  const [refinementSaved, setRefinementSaved] = useState(false);
  const [refinementDismissed, setRefinementDismissed] = useState(false);
  const [refinementSaving, setRefinementSaving] = useState(false);

  const supabase = createClient();

  // ── Handlers ──

  async function handleInfer(description?: string) {
    const input = description ?? freeformInput.trim();
    if (!input) return;

    setState("inferring");

    try {
      const res = await fetch("/api/infer-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: input }),
      });
      const data = await res.json();

      if (data.confidence === "low" && !data.audience && !data.offer) {
        // Inference failed — go to structured fallback
        setCtx({ audience: "", offer: "", outcome: "" });
        setState("editing");
      } else {
        setCtx({
          audience: data.audience || "",
          offer: data.offer || "",
          outcome: data.outcome || "",
          description: data.description || null,
          business_type: data.business_type || null,
        });
        setState("confirm");
      }
    } catch {
      // Network failure — fall back to structured editing
      setCtx({ audience: "", offer: "", outcome: "" });
      setState("editing");
    }
  }

  async function saveContextAndGenerate(context: InferredContext) {
    // 1. Read existing workspace_context and workspaces to avoid overwriting
    let existingCtx: Record<string, string | null> = {};
    let existingWs: Record<string, string | null> = {};
    try {
      const { data: ctxRow } = await supabase
        .from("workspace_context")
        .select("target_audience, offer, brand_notes, business_type")
        .eq("workspace_id", workspaceId)
        .single();
      if (ctxRow) existingCtx = ctxRow as Record<string, string | null>;
    } catch { /* no row */ }

    try {
      const { data: wsRow } = await supabase
        .from("workspaces")
        .select("description, industry")
        .eq("id", workspaceId)
        .single();
      if (wsRow) existingWs = wsRow as Record<string, string | null>;
    } catch { /* no row */ }

    // 2. Build workspace_context patch — only fill empty fields
    const ctxPatch: Record<string, string> = {};
    const filled: string[] = [];

    if (context.audience && !existingCtx.target_audience?.trim()) {
      ctxPatch.target_audience = context.audience;
      filled.push("audience");
    }
    if (context.offer && !existingCtx.offer?.trim()) {
      ctxPatch.offer = context.offer;
      filled.push("offer");
    }
    if (context.business_type && !existingCtx.business_type?.trim()) {
      ctxPatch.business_type = context.business_type;
      filled.push("business type");
    }

    // Append first-run block to brand_notes (never overwrite)
    const existingNotes = existingCtx.brand_notes?.trim() || "";
    const newBlock = `First-run confirmed context:\nAudience: ${context.audience}\nOffer / problem: ${context.offer}\nDesired outcome: ${context.outcome}`;
    ctxPatch.brand_notes = existingNotes
      ? `${existingNotes}\n\n${newBlock}`
      : newBlock;

    // 3. Save workspace_context — await before generating
    const saveRes = await fetch("/api/workspace/context", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ctxPatch),
    });

    if (!saveRes.ok) {
      setGenError("Failed to save business context. Please try again.");
      setState("editing");
      return;
    }

    // 4. Save to workspaces table (description, industry) — only fill empty fields
    const wsPatch: Record<string, string> = {};
    if (context.description && !existingWs.description?.trim()) {
      wsPatch.description = context.description;
      filled.push("description");
    }
    if (context.business_type && !existingWs.industry?.trim()) {
      wsPatch.industry = context.business_type;
      // Don't double-count — "business type" already added above if applicable
    }

    if (Object.keys(wsPatch).length > 0) {
      await supabase
        .from("workspaces")
        .update(wsPatch)
        .eq("id", workspaceId);
    }

    setSavedFields(filled);

    // 3. Generate LinkedIn post
    setState("generating");
    setGenError(null);
    setOutputText("");
    if (streamRef.current) streamRef.current.textContent = "";

    const topic = `Write a LinkedIn post based on this confirmed business context: I help ${context.audience} with ${context.offer} so they can ${context.outcome}. Make it useful, specific, and non-generic.`;

    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_key: "marketing",
          workflow_key: "social_posts",
          input_json: { platform: "linkedin", num_posts: 1, topic },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setGenError(data.error ?? "Generation failed");
        setState("editing");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setGenError("Streaming not supported");
        setState("editing");
        return;
      }

      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          full += decoder.decode(value, { stream: true });
          // Strip META token for display
          const clean = full.replace(/\n__META:\{[^}]*\}__$/, "");
          if (streamRef.current) {
            streamRef.current.textContent = clean;
          }
        }
      }
      full += decoder.decode();
      const cleanOutput = full.replace(/\n__META:\{[^}]*\}__$/, "");

      if (!cleanOutput.trim()) {
        setGenError("Generation returned empty. Please try again.");
        setState("editing");
      } else {
        setOutputText(cleanOutput);
        setState("output");
        window.dispatchEvent(new Event("recents:refresh"));
      }
    } catch {
      setGenError("Network error during generation");
      setState("editing");
    }
  }

  async function handleRefinementSave() {
    const detail = refinementValue.trim();
    if (!detail) return;
    setRefinementSaving(true);

    try {
      let existingNotes = "";
      try {
        const { data: ctxRow } = await supabase
          .from("workspace_context")
          .select("brand_notes")
          .eq("workspace_id", workspaceId)
          .single();
        existingNotes = ctxRow?.brand_notes?.trim() || "";
      } catch { /* no row */ }

      const updated = existingNotes
        ? `${existingNotes}\n\nAdditional context:\n${detail}`
        : detail;

      await fetch("/api/workspace/context", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_notes: updated }),
      });

      setRefinementSaved(true);
    } finally {
      setRefinementSaving(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(outputText.trim());
  }

  // ── Render ──

  // INPUT STATE
  if (state === "input") {
    return (
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-1" style={{ color: textPrimary }}>
          Create your first useful asset in 60 seconds.
        </h2>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: textMuted }}>
          Paste your website, profile, product page, or describe your business in one sentence.
        </p>

        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <input
            type="text"
            value={freeformInput}
            onChange={(e) => setFreeformInput(e.target.value)}
            placeholder="https://yourbusiness.com or I help solo consultants turn client insight into marketing without sounding like generic AI"
            className="w-full px-4 py-3 rounded-lg border outline-none text-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.3)", borderColor: "rgba(255,255,255,0.1)", color: textPrimary }}
            onKeyDown={(e) => { if (e.key === "Enter") handleInfer(); }}
          />

          <button
            onClick={() => handleInfer()}
            disabled={!freeformInput.trim()}
            className="mt-4 text-sm font-medium px-6 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            style={{ color: "#fff", backgroundColor: accent }}
          >
            Understand my business
          </button>
        </div>

        <p className="text-xs mt-4 px-1" style={{ color: textMuted, opacity: 0.6 }}>
          You can add more context later. For now, one honest sentence is enough.
        </p>
      </div>
    );
  }

  // INFERRING STATE
  if (state === "inferring") {
    return (
      <div className="mb-10">
        <div
          className="rounded-xl border p-8 flex items-center justify-center gap-3"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <div
            className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: accent, borderTopColor: "transparent" }}
          />
          <span className="text-sm" style={{ color: textMuted }}>Understanding your business...</span>
        </div>
      </div>
    );
  }

  // CONFIRM STATE
  if (state === "confirm") {
    return (
      <div className="mb-10">
        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <p className="text-sm leading-relaxed mb-5" style={{ color: textPrimary }}>
            I think you help <strong style={{ color: accent }}>{ctx.audience}</strong> with{" "}
            <strong style={{ color: accent }}>{ctx.offer}</strong> so they can{" "}
            <strong style={{ color: accent }}>{ctx.outcome}</strong>. Is this close?
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => saveContextAndGenerate(ctx)}
              className="text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer"
              style={{ color: "#fff", backgroundColor: accent }}
            >
              Yes, create my first draft
            </button>
            <button
              onClick={() => setState("editing")}
              className="text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer"
              style={{ color: accent, backgroundColor: "rgba(108,140,255,0.1)" }}
            >
              Almost — let me tweak it
            </button>
            <button
              onClick={() => { setCtx({ audience: "", offer: "", outcome: "" }); setState("editing"); }}
              className="text-sm px-3 py-2.5 cursor-pointer transition-opacity opacity-60 hover:opacity-100"
              style={{ color: textMuted }}
            >
              Not really
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EDITING STATE (structured fallback)
  if (state === "editing") {
    return (
      <div className="mb-10">
        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          {genError ? (
            <p className="text-xs mb-4" style={{ color: "#f87171" }}>{genError}</p>
          ) : !ctx.audience && !ctx.offer && !ctx.outcome ? (
            <p className="text-xs mb-4" style={{ color: textMuted }}>
              I couldn&apos;t understand enough yet. You can refine it here.
            </p>
          ) : null}

          <div className="space-y-4 mb-5">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: textMuted }}>Who do you help?</label>
              <input
                type="text"
                value={ctx.audience}
                onChange={(e) => setCtx(c => ({ ...c, audience: e.target.value }))}
                placeholder="e.g. solo consultants"
                className="w-full px-3 py-2 rounded-md border outline-none text-sm"
                style={{ backgroundColor: "rgba(0,0,0,0.3)", borderColor: "rgba(255,255,255,0.1)", color: textPrimary }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: textMuted }}>What do you help them do?</label>
              <input
                type="text"
                value={ctx.offer}
                onChange={(e) => setCtx(c => ({ ...c, offer: e.target.value }))}
                placeholder="e.g. turn client insight into marketing"
                className="w-full px-3 py-2 rounded-md border outline-none text-sm"
                style={{ backgroundColor: "rgba(0,0,0,0.3)", borderColor: "rgba(255,255,255,0.1)", color: textPrimary }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: textMuted }}>What outcome do they want?</label>
              <input
                type="text"
                value={ctx.outcome}
                onChange={(e) => setCtx(c => ({ ...c, outcome: e.target.value }))}
                placeholder="e.g. consistent content without a team"
                className="w-full px-3 py-2 rounded-md border outline-none text-sm"
                style={{ backgroundColor: "rgba(0,0,0,0.3)", borderColor: "rgba(255,255,255,0.1)", color: textPrimary }}
              />
            </div>
          </div>

          <button
            onClick={() => saveContextAndGenerate(ctx)}
            disabled={!ctx.audience.trim() && !ctx.offer.trim()}
            className="text-sm font-medium px-6 py-2.5 rounded-lg cursor-pointer disabled:opacity-40"
            style={{ color: "#fff", backgroundColor: accent }}
          >
            Create first draft
          </button>
        </div>
      </div>
    );
  }

  // GENERATING STATE
  if (state === "generating") {
    return (
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider mb-3 px-1" style={{ color: textMuted }}>
          Your first LinkedIn draft
        </p>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />
          <div
            ref={streamRef}
            className="px-6 py-5 text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: textPrimary, contain: "layout style" }}
          />
        </div>
      </div>
    );
  }

  // OUTPUT STATE
  return (
    <div className="mb-10">
      <p className="text-xs font-medium uppercase tracking-wider mb-1 px-1" style={{ color: textMuted }}>
        Your first LinkedIn draft
      </p>
      <p className="text-xs mb-3 px-1" style={{ color: textMuted, opacity: 0.7 }}>
        Generated from the business context you just confirmed.
      </p>

      <div
        className="rounded-xl border overflow-hidden relative group"
        style={{ backgroundColor: surface, borderColor: border }}
      >
        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex flex-col items-center gap-1 rounded-md px-2 py-1.5 transition-all opacity-60 hover:opacity-100 cursor-pointer"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          aria-label="Copy"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span className="text-[10px] leading-none transition-opacity opacity-0 group-hover:opacity-100" style={{ color: textMuted }}>
            Copy
          </span>
        </button>

        <div className="px-6 py-5 pr-20 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: textPrimary }}>
          {outputText}
        </div>
      </div>

      {/* Saved fields confirmation */}
      {savedFields.length > 0 && (
        <div className="mt-3 px-4 py-2.5 rounded-lg text-xs" style={{ backgroundColor: "rgba(108,140,255,0.08)", color: accent }}>
          Saved to your Business Context: {savedFields.join(", ")}. You can review and edit anytime in{" "}
          <Link href="/app/settings" style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}>Settings</Link>.
        </div>
      )}

      {/* Refinement CTA */}
      {!refinementDismissed && !refinementSaved && (
        <div className="mt-4 rounded-lg border px-4 py-3" style={{ borderColor: border, backgroundColor: "rgba(17,24,39,0.6)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: textPrimary }}>
            Want sharper outputs next time?
          </p>
          <p className="text-xs mb-3" style={{ color: textMuted }}>
            Add one real detail SoloStack should remember: <em>What problem do your clients complain about most before they buy?</em>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={refinementValue}
              onChange={(e) => setRefinementValue(e.target.value)}
              placeholder="e.g. They waste hours rewriting generic AI drafts"
              className="flex-1 text-sm px-3 py-2 rounded-md border outline-none"
              style={{ backgroundColor: "rgba(0,0,0,0.3)", borderColor: "rgba(255,255,255,0.1)", color: textPrimary }}
              onKeyDown={(e) => { if (e.key === "Enter") handleRefinementSave(); }}
            />
            <button
              onClick={handleRefinementSave}
              disabled={refinementSaving || !refinementValue.trim()}
              className="text-xs font-medium px-4 py-2 rounded-md cursor-pointer disabled:opacity-40"
              style={{ color: "#fff", backgroundColor: accent }}
            >
              {refinementSaving ? "..." : "Save"}
            </button>
            <button
              onClick={() => setRefinementDismissed(true)}
              className="text-xs px-2 py-2 rounded-md opacity-50 hover:opacity-100 cursor-pointer"
              style={{ color: textMuted }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {refinementSaved && (
        <div className="mt-4 px-4 py-3 rounded-lg text-xs" style={{ backgroundColor: "rgba(108,140,255,0.08)", color: accent }}>
          <p className="font-medium">Saved to <Link href="/app/settings" style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}>Business Context</Link>.</p>
          <p className="mt-0.5 opacity-80">Future outputs will start with more of what you actually know.</p>
        </div>
      )}

      {/* Next steps — shown after refinement CTA is resolved (saved or skipped) */}
      {(refinementSaved || refinementDismissed) && (
        <div className="mt-6 rounded-lg border px-5 py-4" style={{ borderColor: border, backgroundColor: "rgba(17,24,39,0.6)" }}>
          <p className="text-sm font-medium mb-1" style={{ color: textPrimary }}>
            {refinementSaved
              ? "Good. SoloStack now knows a little more about your business."
              : "You can add more Business Context later."}
          </p>
          <p className="text-xs mb-4" style={{ color: textMuted }}>
            What would you like to do next?
          </p>

          {/* Primary actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/marketing"
              className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ color: "#fff", backgroundColor: accent }}
            >
              Create another LinkedIn post
            </Link>
            <Link
              href="/app/outreach"
              className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ color: accent, backgroundColor: "rgba(108,140,255,0.1)" }}
            >
              Write a cold email
            </Link>
            <button
              onClick={() => {
                window.dispatchEvent(new Event("recents:refresh"));
                onDismiss?.();
              }}
              className="text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: accent, backgroundColor: "rgba(108,140,255,0.1)" }}
            >
              Explore SoloStack OS
            </button>
          </div>

          {/* Secondary — Business Context CTA */}
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${border}` }}>
            <p className="text-xs mb-2" style={{ color: textMuted }}>
              Want sharper outputs? Add more Business Context so SoloStack can use your audience, offer, tone, and examples in future workflows.
            </p>
            <Link
              href="/app/settings"
              className="text-xs px-3 py-1.5 rounded-md transition-opacity opacity-60 hover:opacity-100"
              style={{ color: textMuted }}
            >
              Open Business Context
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
