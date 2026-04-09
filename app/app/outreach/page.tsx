"use client";

import { useCallback, useRef, useState } from "react";
import { GlowCard } from "@/components/ui/glow-card";
import { OutputCards } from "@/components/ui/output-cards";
import { StreamingCard } from "@/components/ui/streaming-card";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#22c55e";
const accentLight = "#34d399";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

/* ─── Option data ─── */
const coldEmailGoals = [
  { value: "book_a_call", label: "Book a call" },
  { value: "get_a_reply", label: "Get a reply" },
  { value: "share_a_resource", label: "Share a resource" },
] as const;

const followUpDays = [
  { value: "3_days", label: "3 days" },
  { value: "1_week", label: "1 week" },
  { value: "2_weeks", label: "2 weeks" },
] as const;

const callGoals = [
  { value: "qualify", label: "Qualify" },
  { value: "pitch", label: "Pitch" },
  { value: "explore_fit", label: "Explore fit" },
] as const;

/* ─── Tab definitions ─── */
type TabKey = "cold_email" | "follow_up" | "proposal" | "discovery_prep";

const tabs: { key: TabKey; label: string }[] = [
  { key: "cold_email", label: "Cold Email" },
  { key: "follow_up", label: "Follow-up" },
  { key: "proposal", label: "Proposal" },
  { key: "discovery_prep", label: "Discovery Prep" },
];

const tabDescriptions: Record<TabKey, { title: string; subtitle: string }> = {
  cold_email: { title: "Write a cold email", subtitle: "Generate personalized outreach that gets replies." },
  follow_up: { title: "Write follow-up emails", subtitle: "Generate a 3-email follow-up sequence." },
  proposal: { title: "Write a proposal", subtitle: "Generate a structured project proposal outline." },
  discovery_prep: { title: "Prepare for a discovery call", subtitle: "Generate research, questions, and talking points." },
};

/* ─── Reusable pill selector ─── */
function PillSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium mb-2.5" style={{ color: textPrimary }}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="px-4 py-2.5 text-sm rounded-lg border transition-all cursor-pointer"
            style={{
              backgroundColor: value === o.value ? "rgba(34,197,94,0.1)" : "transparent",
              borderColor: value === o.value ? accent : border,
              color: value === o.value ? accent : textMuted,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Reusable text input ─── */
function TextInput({
  label,
  value,
  onChange,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  optional?: boolean;
}) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium mb-2.5" style={{ color: textPrimary }}>
        {label}
        {optional && <span className="ml-1 text-xs font-normal" style={{ color: textMuted }}>(optional)</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm rounded-lg outline-none placeholder:text-slate-500 transition-shadow focus:ring-2 focus:ring-[#22c55e]/40 focus:shadow-[0_0_0_1px_rgba(34,197,94,0.3)]"
        style={{ backgroundColor: bg, border: `1px solid ${border}`, color: textPrimary }}
      />
    </div>
  );
}

/* ─── Reusable textarea input ─── */
function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
  maxLen = 500,
  optional,
  hideCounter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLen?: number;
  optional?: boolean;
  hideCounter?: boolean;
}) {
  const warnAt = Math.round(maxLen * 0.9);
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium mb-2.5" style={{ color: textPrimary }}>
        {label}
        {optional && <span className="ml-1 text-xs font-normal" style={{ color: textMuted }}>(optional)</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => { if (e.target.value.length <= maxLen) onChange(e.target.value); }}
        maxLength={maxLen}
        rows={3}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm rounded-lg outline-none placeholder:text-slate-500 transition-shadow focus:ring-2 focus:ring-[#22c55e]/40 focus:shadow-[0_0_0_1px_rgba(34,197,94,0.3)] resize-none custom-scrollbar"
        style={{ backgroundColor: bg, border: `1px solid ${border}`, color: textPrimary }}
      />
      {hideCounter ? (
        <p className="text-xs text-white/35 mt-1.5">Output language follows your input language</p>
      ) : (
        <div className="flex justify-between items-center mt-1.5 gap-3">
          <span className="text-xs text-white/35">Output language follows your input language</span>
          <span className="text-[11px] tabular-nums" style={{ color: value.length >= warnAt ? "#f87171" : textMuted }}>
            {value.length}/{maxLen}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Reusable output card list ─── */
/* OutputCards is now shared across all module pages — see components/ui/output-cards.tsx */

/* ─── Loading skeleton ─── */
function LoadingSkeleton({ message }: { message: string }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: surface, borderColor: border }}>
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: accent, borderTopColor: "transparent" }}
          />
          <span className="text-sm" style={{ color: textMuted }}>{message}</span>
        </div>
        <div className="space-y-3">
          <div className="h-4 rounded-md w-full skel" />
          <div className="h-4 rounded-md w-5/6 skel" />
          <div className="h-4 rounded-md w-4/6 skel" />
        </div>
      </div>
    </div>
  );
}

/* ─── Generate button ─── */
function GenerateButton({ loading, disabled, onClick, label }: { loading: boolean; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <div className="relative group mt-1">
      {!disabled && !loading && (
        <div
          className="absolute -inset-1 rounded-2xl opacity-60 group-hover:opacity-80 transition-opacity blur-xl"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accentLight})` }}
        />
      )}
      <button
        onClick={onClick}
        disabled={loading || disabled}
        className="relative w-full py-4 text-base font-semibold rounded-xl transition-all disabled:opacity-30 cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accentLight})`,
          color: "#fff",
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2.5">
            <span
              className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
            />
            Generating...
          </span>
        ) : label}
      </button>
    </div>
  );
}

/* ─── Error display ─── */
function ErrorMsg({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-2 mt-3 px-1">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════════════════════════ */
export default function OutreachPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("cold_email");

  /* ── Cold Email state ── */
  const [ceName, setCeName] = useState("");
  const [ceRole, setCeRole] = useState("");
  const [ceCompany, setCeCompany] = useState("");
  const [ceGoal, setCeGoal] = useState<"book_a_call" | "get_a_reply" | "share_a_resource">("book_a_call");
  const [ceExtra, setCeExtra] = useState("");
  const [ceLoading, setCeLoading] = useState(false);
  const [ceStreaming, setCeStreaming] = useState(false);
  const [ceOutput, setCeOutput] = useState<string | null>(null);
  const [ceError, setCeError] = useState<string | null>(null);
  const [ceCopied, setCeCopied] = useState<number | null>(null);
  const ceStreamTextRef = useRef<HTMLDivElement | null>(null);

  /* ── Follow-up state ── */
  const [fuContext, setFuContext] = useState("");
  const [fuDays, setFuDays] = useState<"3_days" | "1_week" | "2_weeks">("3_days");
  const [fuLoading, setFuLoading] = useState(false);
  const [fuStreaming, setFuStreaming] = useState(false);
  const [fuOutput, setFuOutput] = useState<string | null>(null);
  const [fuError, setFuError] = useState<string | null>(null);
  const [fuCopied, setFuCopied] = useState<number | null>(null);
  const fuStreamTextRef = useRef<HTMLDivElement | null>(null);

  /* ── Proposal state ── */
  const [prType, setPrType] = useState("");
  const [prClient, setPrClient] = useState("");
  const [prBudget, setPrBudget] = useState("");
  const [prExtra, setPrExtra] = useState("");
  const [prLoading, setPrLoading] = useState(false);
  const [prStreaming, setPrStreaming] = useState(false);
  const [prOutput, setPrOutput] = useState<string | null>(null);
  const [prError, setPrError] = useState<string | null>(null);
  const [prCopied, setPrCopied] = useState<number | null>(null);
  const prStreamTextRef = useRef<HTMLDivElement | null>(null);

  /* ── Discovery Prep state ── */
  const [dpCompany, setDpCompany] = useState("");
  const [dpIndustry, setDpIndustry] = useState("");
  const [dpGoal, setDpGoal] = useState<"qualify" | "pitch" | "explore_fit">("qualify");
  const [dpExtra, setDpExtra] = useState("");
  const [dpLoading, setDpLoading] = useState(false);
  const [dpStreaming, setDpStreaming] = useState(false);
  const [dpOutput, setDpOutput] = useState<string | null>(null);
  const [dpError, setDpError] = useState<string | null>(null);
  const [dpCopied, setDpCopied] = useState<number | null>(null);
  const dpStreamTextRef = useRef<HTMLDivElement | null>(null);

  /* ─── Generic helpers ─── */
  async function callWorkflow(
    workflow_key: string,
    input_json: Record<string, unknown>,
    setLoading: (b: boolean) => void,
    setOutput: (s: string | null) => void,
    setError: (s: string | null) => void,
    setStreaming: (b: boolean) => void,
    streamTextRef: React.RefObject<HTMLDivElement | null>,
  ) {
    setLoading(true);
    setOutput(null);
    setError(null);
    // Clear any leftover text from a previous run on the always-mounted
    // streaming card so the first paint of the new run starts empty.
    if (streamTextRef.current) {
      streamTextRef.current.textContent = "";
    }
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_key: "outreach", workflow_key, input_json }),
      });

      // Error path — server returns JSON with a non-2xx status BEFORE
      // any streaming begins (auth, workspace, cap, unknown workflow).
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
        return;
      }

      // Streaming path — write tokens directly to the StreamingCard's
      // text element via the ref, bypassing React state entirely. No
      // reconcile/commit/paint cycle per token, no splitCards reparse,
      // and `contain: layout style` on the text box keeps each append
      // from reflowing the whole page. setOutput is only called once
      // at the end to commit the final string to React for OutputCards.
      const reader = res.body?.getReader();
      if (!reader) {
        setError("Streaming not supported in this browser");
        return;
      }
      const decoder = new TextDecoder();
      let full = "";
      let firstChunk = true;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          full += decoder.decode(value, { stream: true });
          if (streamTextRef.current) {
            streamTextRef.current.textContent = full;
          }
          if (firstChunk) {
            firstChunk = false;
            // Swap the skeleton for the (already-populated) streaming
            // card. These two setState calls are batched by React 18
            // and commit in a single render.
            setLoading(false);
            setStreaming(true);
          }
        }
      }
      // Flush any remaining bytes from the TextDecoder and commit the
      // final text to React state — that renders OutputCards with the
      // fully split markdown and hides the StreamingCard.
      full += decoder.decode();
      if (streamTextRef.current) {
        streamTextRef.current.textContent = full;
      }
      setStreaming(false);
      setOutput(full);
      window.dispatchEvent(new Event("recents:refresh"));
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }

  function splitCards(raw: string | null) {
    if (!raw) return [];
    return raw.split(/\n---\n/).map((p) => p.trim()).filter(Boolean);
  }

  const handleCopy = useCallback(async (text: string, idx: number, setter: (n: number | null) => void) => {
    await navigator.clipboard.writeText(text);
    setter(idx);
    setTimeout(() => setter(null), 2000);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <style>{`
        @keyframes skel-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skel {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: skel-shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-8 sm:py-12">
        {/* ── Tab navigation ── */}
        <div className="mb-8">
          <div className="flex gap-1 flex-wrap border-b" style={{ borderColor: border }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="relative px-4 py-2.5 text-base transition-colors whitespace-nowrap cursor-pointer"
                style={{
                  color: activeTab === t.key ? accent : textMuted,
                  fontWeight: activeTab === t.key ? 600 : 400,
                }}
              >
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: textPrimary }}>
            {tabDescriptions[activeTab].title}
          </h1>
          <p className="text-base mt-1.5" style={{ color: textMuted }}>
            {tabDescriptions[activeTab].subtitle}
          </p>
        </div>

        {/* ════════════════════════════════════════════════
            Cold Email tab
            ════════════════════════════════════════════════ */}
        {activeTab === "cold_email" && (
          <>
            <GlowCard glowColor="green" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-5 sm:p-7">
                <TextInput label="Prospect name" value={ceName} onChange={setCeName} placeholder="e.g. Sarah Chen" />
                <TextInput label="Role" value={ceRole} onChange={setCeRole} placeholder="e.g. VP of Marketing" />
                <TextInput label="Company" value={ceCompany} onChange={setCeCompany} placeholder="e.g. Acme Corp" />
                <PillSelector label="Goal" options={coldEmailGoals} value={ceGoal} onChange={setCeGoal} />
                <TextareaInput
                  label="Additional context"
                  value={ceExtra}
                  onChange={setCeExtra}
                  placeholder="e.g. Write in French, focus on design services, keep it under 100 words..."
                  maxLen={1000}
                  optional
                  hideCounter
                />
                <GenerateButton
                  loading={ceLoading}
                  disabled={!ceName.trim() || !ceRole.trim() || !ceCompany.trim()}
                  onClick={() => callWorkflow("cold_email", { prospect_name: ceName, prospect_role: ceRole, prospect_company: ceCompany, goal: ceGoal, ...(ceExtra.trim() ? { additional_context: ceExtra.trim() } : {}) }, setCeLoading, setCeOutput, setCeError, setCeStreaming, ceStreamTextRef)}
                  label="Generate"
                />
                <ErrorMsg error={ceError} />
              </div>
              </div>
            </GlowCard>
            {ceLoading && !ceStreaming && <LoadingSkeleton message="Writing your cold email..." />}
            <StreamingCard ref={ceStreamTextRef} visible={ceStreaming} accent={accent} accentLight={accentLight} />
            {!ceLoading && !ceStreaming && <OutputCards cards={splitCards(ceOutput)} copiedIdx={ceCopied} onCopy={(t, i) => handleCopy(t, i, setCeCopied)} accent={accent} accentLight={accentLight} contentType="cold_email" onClear={() => { setCeOutput(null); setCeError(null); }} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Follow-up tab
            ════════════════════════════════════════════════ */}
        {activeTab === "follow_up" && (
          <>
            <GlowCard glowColor="green" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-5 sm:p-7">
                <TextareaInput
                  label="What was the original email about?"
                  value={fuContext}
                  onChange={setFuContext}
                  placeholder="e.g. I reached out about our design services after seeing their rebrand announcement..."
                  maxLen={500}
                />
                <PillSelector label="Time since last email" options={followUpDays} value={fuDays} onChange={setFuDays} />
                <GenerateButton
                  loading={fuLoading}
                  disabled={!fuContext.trim()}
                  onClick={() => callWorkflow("follow_up", { context: fuContext, days_since: fuDays }, setFuLoading, setFuOutput, setFuError, setFuStreaming, fuStreamTextRef)}
                  label="Generate"
                />
                <ErrorMsg error={fuError} />
              </div>
              </div>
            </GlowCard>
            {fuLoading && !fuStreaming && <LoadingSkeleton message="Writing follow-up sequence..." />}
            <StreamingCard ref={fuStreamTextRef} visible={fuStreaming} accent={accent} accentLight={accentLight} />
            {!fuLoading && !fuStreaming && <OutputCards cards={splitCards(fuOutput)} copiedIdx={fuCopied} onCopy={(t, i) => handleCopy(t, i, setFuCopied)} accent={accent} accentLight={accentLight} contentType="follow_up" onClear={() => { setFuOutput(null); setFuError(null); }} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Proposal tab
            ════════════════════════════════════════════════ */}
        {activeTab === "proposal" && (
          <>
            <GlowCard glowColor="green" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-5 sm:p-7">
                <TextInput label="Project type" value={prType} onChange={setPrType} placeholder="e.g. Brand identity redesign" />
                <TextInput label="Client name" value={prClient} onChange={setPrClient} placeholder="e.g. Bloom Skincare" />
                <TextInput label="Budget range" value={prBudget} onChange={setPrBudget} placeholder="e.g. $3,000 - $5,000" optional />
                <TextareaInput
                  label="Additional context"
                  value={prExtra}
                  onChange={setPrExtra}
                  placeholder="e.g. Write in French, focus on design services, keep it under 100 words..."
                  maxLen={1000}
                  optional
                  hideCounter
                />
                <GenerateButton
                  loading={prLoading}
                  disabled={!prType.trim() || !prClient.trim()}
                  onClick={() => callWorkflow("proposal", { project_type: prType, client_name: prClient, ...(prBudget.trim() ? { budget_range: prBudget } : {}), ...(prExtra.trim() ? { additional_context: prExtra.trim() } : {}) }, setPrLoading, setPrOutput, setPrError, setPrStreaming, prStreamTextRef)}
                  label="Generate"
                />
                <ErrorMsg error={prError} />
              </div>
              </div>
            </GlowCard>
            {prLoading && !prStreaming && <LoadingSkeleton message="Writing your proposal..." />}
            <StreamingCard ref={prStreamTextRef} visible={prStreaming} accent={accent} accentLight={accentLight} />
            {!prLoading && !prStreaming && <OutputCards cards={splitCards(prOutput)} copiedIdx={prCopied} onCopy={(t, i) => handleCopy(t, i, setPrCopied)} accent={accent} accentLight={accentLight} contentType="proposal" onClear={() => { setPrOutput(null); setPrError(null); }} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Discovery Prep tab
            ════════════════════════════════════════════════ */}
        {activeTab === "discovery_prep" && (
          <>
            <GlowCard glowColor="green" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-5 sm:p-7">
                <TextInput label="Prospect company" value={dpCompany} onChange={setDpCompany} placeholder="e.g. Stripe" />
                <TextInput label="Industry" value={dpIndustry} onChange={setDpIndustry} placeholder="e.g. Fintech / Payments" />
                <PillSelector label="Call goal" options={callGoals} value={dpGoal} onChange={setDpGoal} />
                <TextareaInput
                  label="Additional context"
                  value={dpExtra}
                  onChange={setDpExtra}
                  placeholder="e.g. Write in French, focus on design services, keep it under 100 words..."
                  maxLen={1000}
                  optional
                  hideCounter
                />
                <GenerateButton
                  loading={dpLoading}
                  disabled={!dpCompany.trim() || !dpIndustry.trim()}
                  onClick={() => callWorkflow("discovery_prep", { prospect_company: dpCompany, industry: dpIndustry, call_goal: dpGoal, ...(dpExtra.trim() ? { additional_context: dpExtra.trim() } : {}) }, setDpLoading, setDpOutput, setDpError, setDpStreaming, dpStreamTextRef)}
                  label="Generate"
                />
                <ErrorMsg error={dpError} />
              </div>
              </div>
            </GlowCard>
            {dpLoading && !dpStreaming && <LoadingSkeleton message="Preparing your call notes..." />}
            <StreamingCard ref={dpStreamTextRef} visible={dpStreaming} accent={accent} accentLight={accentLight} />
            {!dpLoading && !dpStreaming && <OutputCards cards={splitCards(dpOutput)} copiedIdx={dpCopied} onCopy={(t, i) => handleCopy(t, i, setDpCopied)} accent={accent} accentLight={accentLight} contentType="discovery_prep" onClear={() => { setDpOutput(null); setDpError(null); }} />}
          </>
        )}
      </div>
    </div>
  );
}
