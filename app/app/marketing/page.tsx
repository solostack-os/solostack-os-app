"use client";

import { useState, useCallback } from "react";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.08)";

/* ─── Shared option data ─── */
const socialPlatforms = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
] as const;

const postCounts = [1, 2, 3] as const;

const adPlatforms = [
  { value: "google_ads", label: "Google Ads" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
] as const;

const adGoals = [
  { value: "awareness", label: "Awareness" },
  { value: "clicks", label: "Clicks" },
  { value: "conversions", label: "Conversions" },
] as const;

const landingSections = [
  { value: "hero", label: "Hero" },
  { value: "features", label: "Features" },
  { value: "cta", label: "CTA" },
  { value: "faq", label: "FAQ" },
  { value: "testimonial_prompt", label: "Testimonial" },
] as const;

const landingGoals = [
  { value: "lead_gen", label: "Lead Gen" },
  { value: "sales", label: "Sales" },
  { value: "waitlist", label: "Waitlist" },
] as const;

const emailTypes = [
  { value: "welcome", label: "Welcome" },
  { value: "promotional", label: "Promotional" },
  { value: "nurture", label: "Nurture" },
  { value: "re_engagement", label: "Re-engagement" },
] as const;

const contentTypes = [
  { value: "blog_post", label: "Blog Post" },
  { value: "video_script", label: "Video Script" },
  { value: "podcast_episode", label: "Podcast Episode" },
] as const;

/* ─── Tab definitions ─── */
type TabKey = "social_posts" | "ad_copy" | "landing_page" | "email_campaign" | "content_brief";

const tabs: { key: TabKey; label: string }[] = [
  { key: "social_posts", label: "Social Posts" },
  { key: "ad_copy", label: "Ad Copy" },
  { key: "landing_page", label: "Landing Page" },
  { key: "email_campaign", label: "Email Campaign" },
  { key: "content_brief", label: "Content Brief" },
];

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
              backgroundColor: value === o.value ? "rgba(108,140,255,0.1)" : "transparent",
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

/* ═══════════════════════════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════════════════════════ */
export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("social_posts");

  /* ── Social Posts state ── */
  const [spPlatform, setSpPlatform] = useState<"instagram" | "linkedin" | "facebook">("linkedin");
  const [spTopic, setSpTopic] = useState("");
  const [spNumPosts, setSpNumPosts] = useState<number>(1);
  const [spLoading, setSpLoading] = useState(false);
  const [spOutput, setSpOutput] = useState<string | null>(null);
  const [spError, setSpError] = useState<string | null>(null);
  const [spCopied, setSpCopied] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  /* ── Ad Copy state ── */
  const [acPlatform, setAcPlatform] = useState<"google_ads" | "facebook" | "instagram">("google_ads");
  const [acGoal, setAcGoal] = useState<"awareness" | "clicks" | "conversions">("clicks");
  const [acTopic, setAcTopic] = useState("");
  const [acLoading, setAcLoading] = useState(false);
  const [acOutput, setAcOutput] = useState<string | null>(null);
  const [acError, setAcError] = useState<string | null>(null);
  const [acCopied, setAcCopied] = useState<number | null>(null);

  /* ── Landing Page state ── */
  const [lpSection, setLpSection] = useState<"hero" | "features" | "cta" | "faq" | "testimonial_prompt">("hero");
  const [lpGoal, setLpGoal] = useState<"lead_gen" | "sales" | "waitlist">("lead_gen");
  const [lpTopic, setLpTopic] = useState("");
  const [lpLoading, setLpLoading] = useState(false);
  const [lpOutput, setLpOutput] = useState<string | null>(null);
  const [lpError, setLpError] = useState<string | null>(null);
  const [lpCopied, setLpCopied] = useState<number | null>(null);

  /* ── Email Campaign state ── */
  const [ecType, setEcType] = useState<"welcome" | "promotional" | "nurture" | "re_engagement">("welcome");
  const [ecTopic, setEcTopic] = useState("");
  const [ecLoading, setEcLoading] = useState(false);
  const [ecOutput, setEcOutput] = useState<string | null>(null);
  const [ecError, setEcError] = useState<string | null>(null);
  const [ecCopied, setEcCopied] = useState<number | null>(null);

  /* ── Content Brief state ── */
  const [cbType, setCbType] = useState<"blog_post" | "video_script" | "podcast_episode">("blog_post");
  const [cbTopic, setCbTopic] = useState("");
  const [cbLoading, setCbLoading] = useState(false);
  const [cbOutput, setCbOutput] = useState<string | null>(null);
  const [cbError, setCbError] = useState<string | null>(null);
  const [cbCopied, setCbCopied] = useState<number | null>(null);

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
        body: JSON.stringify({ module_key: "marketing", workflow_key, input_json }),
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

  /* ─── Suggestion platform mapping ─── */
  function getSuggestPlatform(): "instagram" | "linkedin" | "facebook" {
    if (activeTab === "social_posts") return spPlatform;
    if (activeTab === "ad_copy") {
      if (acPlatform === "facebook") return "facebook";
      if (acPlatform === "instagram") return "instagram";
      return "facebook";
    }
    return "linkedin";
  }

  async function handleSuggest() {
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_key: "marketing", workflow_key: "topic_suggestions", input_json: { platform: getSuggestPlatform() } }),
      });
      const data = await res.json();
      if (res.ok && data.output_markdown) {
        const cleaned = data.output_markdown.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) setSuggestions(parsed);
      }
    } catch (err) {
      console.error("[topic_suggestions] error:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  /* ─── Social Posts handlers ─── */
  function handleSpGenerate() {
    if (!spTopic.trim()) return;
    callWorkflow("social_posts", { platform: spPlatform, topic: spTopic, num_posts: spNumPosts }, setSpLoading, setSpOutput, setSpError);
  }

  function handleSpTopicChange(value: string) {
    if (value.length > 200) return;
    setSpTopic(value);
    if (suggestions.length > 0) setSuggestions([]);
  }

  /* ─── Tab header descriptions ─── */
  const tabDescriptions: Record<TabKey, { title: string; subtitle: string }> = {
    social_posts: { title: "Create social media posts", subtitle: "Generate platform-ready posts using your business context." },
    ad_copy: { title: "Create ad copy", subtitle: "Generate high-converting ad variations for any platform." },
    landing_page: { title: "Create landing page copy", subtitle: "Generate conversion-focused copy for any section." },
    email_campaign: { title: "Create marketing emails", subtitle: "Generate complete, ready-to-send marketing emails." },
    content_brief: { title: "Create a content brief", subtitle: "Generate structured briefs for any content format." },
  };

  /* ─── Topic input with sparkle suggestions ─── */
  function TopicInput({
    value,
    onChange,
    placeholder,
    maxLen = 200,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    maxLen?: number;
  }) {
    const warnAt = Math.round(maxLen * 0.9);
    return (
      <div className="mb-5">
        <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
          Topic
        </label>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => { if (e.target.value.length <= maxLen) onChange(e.target.value); }}
            maxLength={maxLen}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-11 text-sm rounded-lg outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#6c8cff]/50"
            style={{ backgroundColor: bg, border: `1px solid ${border}`, color: textPrimary }}
          />
          <button
            type="button"
            onClick={handleSuggest}
            disabled={loadingSuggestions}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors hover:bg-white/10 disabled:opacity-40"
            aria-label="Suggest topics"
            title="Get AI topic ideas"
          >
            {loadingSuggestions ? (
              <div
                className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: accent, borderTopColor: "transparent" }}
              />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                <path d="M20 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex justify-end mt-1.5">
          <span className="text-[11px] tabular-nums" style={{ color: value.length >= warnAt ? "#f87171" : textMuted }}>
            {value.length}/{maxLen}
          </span>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { onChange(s); setSuggestions([]); }}
                className="px-3 py-1.5 text-xs rounded-full border transition-all hover:border-[#6c8cff]/60 hover:bg-[#6c8cff]/10"
                style={{ color: textPrimary, borderColor: border }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* ── Tab navigation ── */}
        <div className="mb-8 -mx-6 px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setSuggestions([]); }}
                className="px-4 py-2 text-sm rounded-lg transition-all whitespace-nowrap"
                style={{
                  backgroundColor: activeTab === t.key ? "rgba(108,140,255,0.1)" : "transparent",
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
            Social Posts tab
            ════════════════════════════════════════════════ */}
        {activeTab === "social_posts" && (
          <>
            <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
              <PillSelector label="Platform" options={socialPlatforms} value={spPlatform} onChange={setSpPlatform} />
              <TopicInput
                value={spTopic}
                onChange={handleSpTopicChange}
                placeholder="e.g. Why small businesses need a content strategy"
              />
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>Number of posts</label>
                <div className="flex gap-2">
                  {postCounts.map((n) => (
                    <button
                      key={n}
                      onClick={() => setSpNumPosts(n)}
                      className="w-12 h-10 text-sm rounded-lg border transition-all"
                      style={{
                        backgroundColor: spNumPosts === n ? "rgba(108,140,255,0.1)" : "transparent",
                        borderColor: spNumPosts === n ? accent : border,
                        color: spNumPosts === n ? accent : textMuted,
                        boxShadow: spNumPosts === n ? `0 0 0 1px ${accent}` : "none",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <GenerateButton loading={spLoading} disabled={!spTopic.trim()} onClick={handleSpGenerate} label="Generate" />
              <ErrorMsg error={spError} />
            </div>
            {spLoading && <LoadingSkeleton message="Generating your posts..." />}
            {!spLoading && <OutputCards cards={splitCards(spOutput)} copiedIdx={spCopied} onCopy={(t, i) => handleCopy(t, i, setSpCopied)} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Ad Copy tab
            ════════════════════════════════════════════════ */}
        {activeTab === "ad_copy" && (
          <>
            <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
              <PillSelector label="Platform" options={adPlatforms} value={acPlatform} onChange={setAcPlatform} />
              <PillSelector label="Goal" options={adGoals} value={acGoal} onChange={setAcGoal} />
              <TopicInput value={acTopic} onChange={(v) => { setAcTopic(v); if (suggestions.length) setSuggestions([]); }} placeholder="e.g. Summer sale on premium headphones" />
              <GenerateButton
                loading={acLoading}
                disabled={!acTopic.trim()}
                onClick={() => callWorkflow("ad_copy", { platform: acPlatform, goal: acGoal, topic: acTopic }, setAcLoading, setAcOutput, setAcError)}
                label="Generate"
              />
              <ErrorMsg error={acError} />
            </div>
            {acLoading && <LoadingSkeleton message="Generating ad variations..." />}
            {!acLoading && <OutputCards cards={splitCards(acOutput)} copiedIdx={acCopied} onCopy={(t, i) => handleCopy(t, i, setAcCopied)} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Landing Page tab
            ════════════════════════════════════════════════ */}
        {activeTab === "landing_page" && (
          <>
            <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
              <PillSelector label="Section" options={landingSections} value={lpSection} onChange={setLpSection} />
              <PillSelector label="Goal" options={landingGoals} value={lpGoal} onChange={setLpGoal} />
              <TopicInput value={lpTopic} onChange={(v) => { setLpTopic(v); if (suggestions.length) setSuggestions([]); }} placeholder="e.g. AI-powered project management tool" maxLen={300} />
              <GenerateButton
                loading={lpLoading}
                disabled={!lpTopic.trim()}
                onClick={() => callWorkflow("landing_page", { section: lpSection, goal: lpGoal, topic: lpTopic }, setLpLoading, setLpOutput, setLpError)}
                label="Generate"
              />
              <ErrorMsg error={lpError} />
            </div>
            {lpLoading && <LoadingSkeleton message="Generating landing page copy..." />}
            {!lpLoading && <OutputCards cards={splitCards(lpOutput)} copiedIdx={lpCopied} onCopy={(t, i) => handleCopy(t, i, setLpCopied)} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Email Campaign tab
            ════════════════════════════════════════════════ */}
        {activeTab === "email_campaign" && (
          <>
            <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
              <PillSelector label="Email type" options={emailTypes} value={ecType} onChange={setEcType} />
              <TopicInput value={ecTopic} onChange={(v) => { setEcTopic(v); if (suggestions.length) setSuggestions([]); }} placeholder="e.g. New feature launch announcement" maxLen={300} />
              <GenerateButton
                loading={ecLoading}
                disabled={!ecTopic.trim()}
                onClick={() => callWorkflow("email_campaign", { email_type: ecType, topic: ecTopic }, setEcLoading, setEcOutput, setEcError)}
                label="Generate"
              />
              <ErrorMsg error={ecError} />
            </div>
            {ecLoading && <LoadingSkeleton message="Generating your email..." />}
            {!ecLoading && <OutputCards cards={splitCards(ecOutput)} copiedIdx={ecCopied} onCopy={(t, i) => handleCopy(t, i, setEcCopied)} />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Content Brief tab
            ════════════════════════════════════════════════ */}
        {activeTab === "content_brief" && (
          <>
            <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
              <PillSelector label="Content type" options={contentTypes} value={cbType} onChange={setCbType} />
              <TopicInput value={cbTopic} onChange={(v) => { setCbTopic(v); if (suggestions.length) setSuggestions([]); }} placeholder="e.g. How to build a personal brand in 2025" maxLen={400} />
              <GenerateButton
                loading={cbLoading}
                disabled={!cbTopic.trim()}
                onClick={() => callWorkflow("content_brief", { content_type: cbType, topic: cbTopic }, setCbLoading, setCbOutput, setCbError)}
                label="Generate"
              />
              <ErrorMsg error={cbError} />
            </div>
            {cbLoading && <LoadingSkeleton message="Generating your brief..." />}
            {!cbLoading && <OutputCards cards={splitCards(cbOutput)} copiedIdx={cbCopied} onCopy={(t, i) => handleCopy(t, i, setCbCopied)} />}
          </>
        )}
      </div>
    </div>
  );
}
