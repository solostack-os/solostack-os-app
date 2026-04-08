"use client";

import { useState, useCallback } from "react";
import { GlowCard } from "@/components/ui/glow-card";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const surfaceLight = "#151d2e";
const accent = "#f97316";
const accentLight = "#fb923c";
const accentGlow = "rgba(249,115,22,0.25)";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

/* ─── Option data ─── */
const departments = [
  { value: "operations", label: "Operations" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "finance", label: "Finance" },
] as const;

const detailLevels = [
  { value: "summary", label: "Summary" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
] as const;

const workStyles = [
  { value: "deep_work", label: "Deep Work" },
  { value: "mixed", label: "Mixed" },
  { value: "meetings_heavy", label: "Meetings-Heavy" },
] as const;

const outputFormats = [
  { value: "bullet_summary", label: "Bullet Summary" },
  { value: "step_by_step", label: "Step-by-Step" },
  { value: "decision_tree", label: "Decision Tree" },
] as const;

/* ─── Tab definitions ─── */
type TabKey = "sop_generator" | "weekly_plan" | "onboarding_doc" | "process_notes";

const tabs: { key: TabKey; label: string }[] = [
  { key: "sop_generator", label: "SOP Generator" },
  { key: "weekly_plan", label: "Weekly Plan" },
  { key: "onboarding_doc", label: "Onboarding Doc" },
  { key: "process_notes", label: "Process Notes" },
];

const tabDescriptions: Record<TabKey, { title: string; subtitle: string }> = {
  sop_generator: { title: "Generate an SOP", subtitle: "Create a structured standard operating procedure for any process." },
  weekly_plan: { title: "Plan your week", subtitle: "Generate a focused weekly plan with daily themes and time blocks." },
  onboarding_doc: { title: "Create an onboarding doc", subtitle: "Generate a professional client onboarding document." },
  process_notes: { title: "Structure process notes", subtitle: "Turn rough notes into clean, structured documentation." },
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
              backgroundColor: value === o.value ? "rgba(249,115,22,0.1)" : "transparent",
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium mb-2.5" style={{ color: textPrimary }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm rounded-lg outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#f97316]/40 focus:shadow-[0_0_0_1px_rgba(249,115,22,0.3)] transition-shadow"
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
  rows = 3,
  optional,
  hideCounter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLen?: number;
  rows?: number;
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
        rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm rounded-lg outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#f97316]/40 focus:shadow-[0_0_0_1px_rgba(249,115,22,0.3)] transition-shadow resize-none"
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
function OutputCards({
  cards,
  copiedIdx,
  onCopy,
}: {
  cards: string[];
  copiedIdx: number | null;
  onCopy: (text: string, idx: number) => void;
}) {
  if (cards.length === 0) return null;
  return (
    <div className="space-y-4">
      <span className="text-[11px] font-medium uppercase tracking-wider px-0.5" style={{ color: textMuted }}>
        Output
      </span>
      {cards.map((card, idx) => {
        const isCopied = copiedIdx === idx;
        return (
          <div
            key={idx}
            className="relative rounded-xl border overflow-hidden group"
            style={{ backgroundColor: surface, borderColor: border }}
          >
            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />
            <button
              onClick={() => onCopy(card, idx)}
              className="absolute top-3 right-3 flex flex-col items-center gap-1 rounded-md px-2 py-1.5 transition-all opacity-60 hover:opacity-100 cursor-pointer"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              aria-label="Copy"
            >
              {isCopied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
              <span
                className="text-[10px] leading-none transition-opacity opacity-0 group-hover:opacity-100"
                style={{ color: isCopied ? "#5eead4" : textMuted }}
              >
                {isCopied ? "Done" : "Copy"}
              </span>
            </button>
            <div
              className="px-6 py-5 pr-16 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: textPrimary }}
            >
              {card}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Loading skeleton ─── */
function LoadingSkeleton({ message }: { message: string }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: surface, borderColor: border }}>
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: accent, borderTopColor: "transparent" }}
          />
          <span className="text-sm" style={{ color: textMuted }}>{message}</span>
        </div>
        <div className="space-y-3">
          <div className="skel h-4 rounded w-full" />
          <div className="skel h-4 rounded w-5/6" />
          <div className="skel h-4 rounded w-4/6" />
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
    <div className="flex items-center gap-2 mt-3 justify-center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("sop_generator");

  /* ── SOP Generator state ── */
  const [sopName, setSopName] = useState("");
  const [sopDept, setSopDept] = useState<"operations" | "marketing" | "sales" | "finance">("operations");
  const [sopDetail, setSopDetail] = useState<"summary" | "standard" | "detailed">("standard");
  const [sopExtra, setSopExtra] = useState("");
  const [sopLoading, setSopLoading] = useState(false);
  const [sopOutput, setSopOutput] = useState<string | null>(null);
  const [sopError, setSopError] = useState<string | null>(null);
  const [sopCopied, setSopCopied] = useState<number | null>(null);

  /* ── Weekly Plan state ── */
  const [wpFocus, setWpFocus] = useState("");
  const [wpPriorities, setWpPriorities] = useState("");
  const [wpStyle, setWpStyle] = useState<"deep_work" | "mixed" | "meetings_heavy">("mixed");
  const [wpLoading, setWpLoading] = useState(false);
  const [wpOutput, setWpOutput] = useState<string | null>(null);
  const [wpError, setWpError] = useState<string | null>(null);
  const [wpCopied, setWpCopied] = useState<number | null>(null);

  /* ── Onboarding Doc state ── */
  const [obClient, setObClient] = useState("");
  const [obService, setObService] = useState("");
  const [obDate, setObDate] = useState("");
  const [obDeliverables, setObDeliverables] = useState("");
  const [obLoading, setObLoading] = useState(false);
  const [obOutput, setObOutput] = useState<string | null>(null);
  const [obError, setObError] = useState<string | null>(null);
  const [obCopied, setObCopied] = useState<number | null>(null);

  /* ── Process Notes state ── */
  const [pnTitle, setPnTitle] = useState("");
  const [pnNotes, setPnNotes] = useState("");
  const [pnFormat, setPnFormat] = useState<"bullet_summary" | "step_by_step" | "decision_tree">("bullet_summary");
  const [pnLoading, setPnLoading] = useState(false);
  const [pnOutput, setPnOutput] = useState<string | null>(null);
  const [pnError, setPnError] = useState<string | null>(null);
  const [pnCopied, setPnCopied] = useState<number | null>(null);

  /* ─── Generic helpers ─── */
  async function callWorkflow(
    workflow_key: string,
    input_json: Record<string, unknown>,
    setLoading: (b: boolean) => void,
    setOutput: (s: string | null) => void,
    setError: (s: string | null) => void,
  ) {
    setLoading(true);
    setOutput(null);
    setError(null);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_key: "operations", workflow_key, input_json }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setOutput(data.output_markdown);
        window.dispatchEvent(new Event("recents:refresh"));
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function wrapOutput(raw: string | null) {
    if (!raw) return [];
    return [raw.trim()];
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
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .skel {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: skel-shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        {/* ── Tab navigation ── */}
        <div className="mb-8 -mx-6 px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max border-b" style={{ borderColor: border }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="relative px-4 py-2 text-base transition-all whitespace-nowrap cursor-pointer"
                style={{
                  color: activeTab === t.key ? accent : textMuted,
                  fontWeight: activeTab === t.key ? 600 : 400,
                }}
              >
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: accent }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {tabDescriptions[activeTab].title}
          </h1>
          <p className="text-base mt-1.5" style={{ color: textMuted }}>
            {tabDescriptions[activeTab].subtitle}
          </p>
        </div>

        {/* ════════════════════════════════════════════════
            SOP Generator tab
            ════════════════════════════════════════════════ */}
        {activeTab === "sop_generator" && (
          <>
            <GlowCard glowColor="orange" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-7">
                <TextInput label="Process name" value={sopName} onChange={setSopName} placeholder="e.g. Client onboarding" />
                <PillSelector label="Department" options={departments} value={sopDept} onChange={setSopDept} />
                <PillSelector label="Detail level" options={detailLevels} value={sopDetail} onChange={setSopDetail} />
                <TextareaInput
                  label="Additional context"
                  value={sopExtra}
                  onChange={setSopExtra}
                  placeholder="e.g. Write in French, focus on design services, keep it under 100 words..."
                  maxLen={1000}
                  optional
                  hideCounter
                />
                <GenerateButton
                  loading={sopLoading}
                  disabled={!sopName.trim()}
                  onClick={() => callWorkflow("sop_generator", { process_name: sopName, department: sopDept, detail_level: sopDetail, ...(sopExtra.trim() ? { additional_context: sopExtra.trim() } : {}) }, setSopLoading, setSopOutput, setSopError)}
                  label="Generate"
                />
                <ErrorMsg error={sopError} />
              </div>
              </div>
            </GlowCard>
            {sopLoading && <LoadingSkeleton message="Generating your SOP..." />}
            {!sopLoading && <OutputCards cards={wrapOutput(sopOutput)} copiedIdx={sopCopied} onCopy={(t, i) => handleCopy(t, i, setSopCopied)} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Weekly Plan tab
            ════════════════════════════════════════════════ */}
        {activeTab === "weekly_plan" && (
          <>
            <GlowCard glowColor="orange" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-7">
                <TextInput label="Focus area" value={wpFocus} onChange={setWpFocus} placeholder="e.g. Product launch prep" />
                <TextareaInput
                  label="Priorities"
                  value={wpPriorities}
                  onChange={setWpPriorities}
                  placeholder="List your top priorities or projects for the week"
                  maxLen={500}
                />
                <PillSelector label="Work style" options={workStyles} value={wpStyle} onChange={setWpStyle} />
                <GenerateButton
                  loading={wpLoading}
                  disabled={!wpFocus.trim() || !wpPriorities.trim()}
                  onClick={() => callWorkflow("weekly_plan", { focus_area: wpFocus, priorities: wpPriorities, work_style: wpStyle }, setWpLoading, setWpOutput, setWpError)}
                  label="Generate"
                />
                <ErrorMsg error={wpError} />
              </div>
              </div>
            </GlowCard>
            {wpLoading && <LoadingSkeleton message="Planning your week..." />}
            {!wpLoading && <OutputCards cards={wrapOutput(wpOutput)} copiedIdx={wpCopied} onCopy={(t, i) => handleCopy(t, i, setWpCopied)} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Onboarding Doc tab
            ════════════════════════════════════════════════ */}
        {activeTab === "onboarding_doc" && (
          <>
            <GlowCard glowColor="orange" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-7">
                <TextInput label="Client name" value={obClient} onChange={setObClient} placeholder="e.g. Bloom Skincare" />
                <TextInput label="Service type" value={obService} onChange={setObService} placeholder="e.g. Brand identity" />
                <TextInput label="Start date" value={obDate} onChange={setObDate} placeholder="e.g. May 1, 2025" />
                <TextareaInput
                  label="Key deliverables"
                  value={obDeliverables}
                  onChange={setObDeliverables}
                  placeholder="List the main deliverables for this project"
                  maxLen={500}
                />
                <GenerateButton
                  loading={obLoading}
                  disabled={!obClient.trim() || !obService.trim() || !obDate.trim()}
                  onClick={() => callWorkflow("onboarding_doc", { client_name: obClient, service_type: obService, start_date: obDate, key_deliverables: obDeliverables }, setObLoading, setObOutput, setObError)}
                  label="Generate"
                />
                <ErrorMsg error={obError} />
              </div>
              </div>
            </GlowCard>
            {obLoading && <LoadingSkeleton message="Creating onboarding doc..." />}
            {!obLoading && <OutputCards cards={wrapOutput(obOutput)} copiedIdx={obCopied} onCopy={(t, i) => handleCopy(t, i, setObCopied)} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Process Notes tab
            ════════════════════════════════════════════════ */}
        {activeTab === "process_notes" && (
          <>
            <GlowCard glowColor="orange" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-7">
                <TextInput label="Process title" value={pnTitle} onChange={setPnTitle} placeholder="e.g. Monthly reporting" />
                <TextareaInput
                  label="Raw notes"
                  value={pnNotes}
                  onChange={setPnNotes}
                  placeholder="Paste your rough notes, steps, or observations here"
                  maxLen={2000}
                  rows={6}
                />
                <PillSelector label="Output format" options={outputFormats} value={pnFormat} onChange={setPnFormat} />
                <GenerateButton
                  loading={pnLoading}
                  disabled={!pnTitle.trim() || !pnNotes.trim()}
                  onClick={() => callWorkflow("process_notes", { process_title: pnTitle, raw_notes: pnNotes, output_format: pnFormat }, setPnLoading, setPnOutput, setPnError)}
                  label="Generate"
                />
                <ErrorMsg error={pnError} />
              </div>
              </div>
            </GlowCard>
            {pnLoading && <LoadingSkeleton message="Structuring your notes..." />}
            {!pnLoading && <OutputCards cards={wrapOutput(pnOutput)} copiedIdx={pnCopied} onCopy={(t, i) => handleCopy(t, i, setPnCopied)} />}
          </>
        )}
      </div>
    </div>
  );
}
