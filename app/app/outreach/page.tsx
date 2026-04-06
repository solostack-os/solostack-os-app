"use client";

import { useState, useCallback } from "react";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#22c55e";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.08)";

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
      <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="px-4 py-2 text-sm rounded-lg border transition-all"
            style={{
              backgroundColor: value === o.value ? "rgba(34,197,94,0.1)" : "transparent",
              borderColor: value === o.value ? accent : border,
              color: value === o.value ? accent : textMuted,
              boxShadow: value === o.value ? `0 0 0 1px ${accent}` : "none",
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
      <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
        {label}
        {optional && <span className="ml-1 text-xs font-normal" style={{ color: textMuted }}>(optional)</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm rounded-lg outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#22c55e]/50"
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLen?: number;
}) {
  const warnAt = Math.round(maxLen * 0.9);
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => { if (e.target.value.length <= maxLen) onChange(e.target.value); }}
        maxLength={maxLen}
        rows={3}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm rounded-lg outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#22c55e]/50 resize-none"
        style={{ backgroundColor: bg, border: `1px solid ${border}`, color: textPrimary }}
      />
      <div className="flex justify-end mt-1.5">
        <span className="text-[11px] tabular-nums" style={{ color: value.length >= warnAt ? "#f87171" : textMuted }}>
          {value.length}/{maxLen}
        </span>
      </div>
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
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textMuted }}>
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
            <button
              onClick={() => onCopy(card, idx)}
              className="absolute top-3 right-3 flex flex-col items-center gap-1 rounded-md px-2 py-1.5 transition-all opacity-60 hover:opacity-100"
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
    <div className="rounded-xl p-6 border" style={{ backgroundColor: surface, borderColor: border }}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: accent, borderTopColor: "transparent" }}
        />
        <span className="text-sm" style={{ color: textMuted }}>{message}</span>
      </div>
      <div className="space-y-3">
        <div className="h-4 rounded w-full animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
        <div className="h-4 rounded w-5/6 animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
        <div className="h-4 rounded w-4/6 animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
      </div>
    </div>
  );
}

/* ─── Generate button ─── */
function GenerateButton({ loading, disabled, onClick, label }: { loading: boolean; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full py-3 text-sm font-medium rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40"
      style={{ backgroundColor: accent, color: bg }}
    >
      {loading ? "Generating..." : label}
    </button>
  );
}

/* ─── Error display ─── */
function ErrorMsg({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="text-sm mt-3 text-center" style={{ color: "#f87171" }}>{error}</p>;
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
  const [ceLoading, setCeLoading] = useState(false);
  const [ceOutput, setCeOutput] = useState<string | null>(null);
  const [ceError, setCeError] = useState<string | null>(null);
  const [ceCopied, setCeCopied] = useState<number | null>(null);

  /* ── Follow-up state ── */
  const [fuContext, setFuContext] = useState("");
  const [fuDays, setFuDays] = useState<"3_days" | "1_week" | "2_weeks">("3_days");
  const [fuLoading, setFuLoading] = useState(false);
  const [fuOutput, setFuOutput] = useState<string | null>(null);
  const [fuError, setFuError] = useState<string | null>(null);
  const [fuCopied, setFuCopied] = useState<number | null>(null);

  /* ── Proposal state ── */
  const [prType, setPrType] = useState("");
  const [prClient, setPrClient] = useState("");
  const [prBudget, setPrBudget] = useState("");
  const [prLoading, setPrLoading] = useState(false);
  const [prOutput, setPrOutput] = useState<string | null>(null);
  const [prError, setPrError] = useState<string | null>(null);
  const [prCopied, setPrCopied] = useState<number | null>(null);

  /* ── Discovery Prep state ── */
  const [dpCompany, setDpCompany] = useState("");
  const [dpIndustry, setDpIndustry] = useState("");
  const [dpGoal, setDpGoal] = useState<"qualify" | "pitch" | "explore_fit">("qualify");
  const [dpLoading, setDpLoading] = useState(false);
  const [dpOutput, setDpOutput] = useState<string | null>(null);
  const [dpError, setDpError] = useState<string | null>(null);
  const [dpCopied, setDpCopied] = useState<number | null>(null);

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
        body: JSON.stringify({ module_key: "outreach", workflow_key, input_json }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setOutput(data.output_markdown);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
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
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* ── Tab navigation ── */}
        <div className="mb-8 -mx-6 px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="px-4 py-2 text-sm rounded-lg transition-all whitespace-nowrap"
                style={{
                  backgroundColor: activeTab === t.key ? "rgba(34,197,94,0.1)" : "transparent",
                  color: activeTab === t.key ? accent : textMuted,
                  fontWeight: activeTab === t.key ? 600 : 400,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {tabDescriptions[activeTab].title}
          </h1>
          <p className="text-sm mt-1" style={{ color: textMuted }}>
            {tabDescriptions[activeTab].subtitle}
          </p>
        </div>

        {/* ════════════════════════════════════════════════
            Cold Email tab
            ════════════════════════════════════════════════ */}
        {activeTab === "cold_email" && (
          <>
            <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
              <TextInput label="Prospect name" value={ceName} onChange={setCeName} placeholder="e.g. Sarah Chen" />
              <TextInput label="Role" value={ceRole} onChange={setCeRole} placeholder="e.g. VP of Marketing" />
              <TextInput label="Company" value={ceCompany} onChange={setCeCompany} placeholder="e.g. Acme Corp" />
              <PillSelector label="Goal" options={coldEmailGoals} value={ceGoal} onChange={setCeGoal} />
              <GenerateButton
                loading={ceLoading}
                disabled={!ceName.trim() || !ceRole.trim() || !ceCompany.trim()}
                onClick={() => callWorkflow("cold_email", { prospect_name: ceName, prospect_role: ceRole, prospect_company: ceCompany, goal: ceGoal }, setCeLoading, setCeOutput, setCeError)}
                label="Generate"
              />
              <ErrorMsg error={ceError} />
            </div>
            {ceLoading && <LoadingSkeleton message="Writing your cold email..." />}
            {!ceLoading && <OutputCards cards={splitCards(ceOutput)} copiedIdx={ceCopied} onCopy={(t, i) => handleCopy(t, i, setCeCopied)} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Follow-up tab
            ════════════════════════════════════════════════ */}
        {activeTab === "follow_up" && (
          <>
            <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
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
                onClick={() => callWorkflow("follow_up", { context: fuContext, days_since: fuDays }, setFuLoading, setFuOutput, setFuError)}
                label="Generate"
              />
              <ErrorMsg error={fuError} />
            </div>
            {fuLoading && <LoadingSkeleton message="Writing follow-up sequence..." />}
            {!fuLoading && <OutputCards cards={splitCards(fuOutput)} copiedIdx={fuCopied} onCopy={(t, i) => handleCopy(t, i, setFuCopied)} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Proposal tab
            ════════════════════════════════════════════════ */}
        {activeTab === "proposal" && (
          <>
            <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
              <TextInput label="Project type" value={prType} onChange={setPrType} placeholder="e.g. Brand identity redesign" />
              <TextInput label="Client name" value={prClient} onChange={setPrClient} placeholder="e.g. Bloom Skincare" />
              <TextInput label="Budget range" value={prBudget} onChange={setPrBudget} placeholder="e.g. $3,000 - $5,000" optional />
              <GenerateButton
                loading={prLoading}
                disabled={!prType.trim() || !prClient.trim()}
                onClick={() => callWorkflow("proposal", { project_type: prType, client_name: prClient, ...(prBudget.trim() ? { budget_range: prBudget } : {}) }, setPrLoading, setPrOutput, setPrError)}
                label="Generate"
              />
              <ErrorMsg error={prError} />
            </div>
            {prLoading && <LoadingSkeleton message="Writing your proposal..." />}
            {!prLoading && <OutputCards cards={splitCards(prOutput)} copiedIdx={prCopied} onCopy={(t, i) => handleCopy(t, i, setPrCopied)} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Discovery Prep tab
            ════════════════════════════════════════════════ */}
        {activeTab === "discovery_prep" && (
          <>
            <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
              <TextInput label="Prospect company" value={dpCompany} onChange={setDpCompany} placeholder="e.g. Stripe" />
              <TextInput label="Industry" value={dpIndustry} onChange={setDpIndustry} placeholder="e.g. Fintech / Payments" />
              <PillSelector label="Call goal" options={callGoals} value={dpGoal} onChange={setDpGoal} />
              <GenerateButton
                loading={dpLoading}
                disabled={!dpCompany.trim() || !dpIndustry.trim()}
                onClick={() => callWorkflow("discovery_prep", { prospect_company: dpCompany, industry: dpIndustry, call_goal: dpGoal }, setDpLoading, setDpOutput, setDpError)}
                label="Generate"
              />
              <ErrorMsg error={dpError} />
            </div>
            {dpLoading && <LoadingSkeleton message="Preparing your call notes..." />}
            {!dpLoading && <OutputCards cards={splitCards(dpOutput)} copiedIdx={dpCopied} onCopy={(t, i) => handleCopy(t, i, setDpCopied)} />}
          </>
        )}
      </div>
    </div>
  );
}
