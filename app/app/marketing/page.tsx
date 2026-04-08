"use client";

import { useState, useCallback } from "react";
import { GlowCard } from "@/components/ui/glow-card";
import { OutputCards } from "@/components/ui/output-cards";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const surfaceLight = "#151d2e";
const accent = "#6c8cff";
const accentLight = "#818cf8";
const accentGlow = "rgba(108,140,255,0.25)";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

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
              backgroundColor: value === o.value ? `rgba(108,140,255,0.1)` : "transparent",
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
        window.dispatchEvent(new Event("recents:refresh"));
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
        <label className="block text-sm font-medium mb-2.5" style={{ color: textPrimary }}>
          Topic
        </label>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => { if (e.target.value.length <= maxLen) onChange(e.target.value); }}
            maxLength={maxLen}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-11 text-sm rounded-lg outline-none placeholder:text-slate-500 transition-shadow focus:ring-2 focus:ring-[#6c8cff]/40 focus:shadow-[0_0_0_1px_rgba(108,140,255,0.3)]"
            style={{ backgroundColor: bg, border: `1px solid ${border}`, color: textPrimary }}
          />
          <button
            type="button"
            onClick={handleSuggest}
            disabled={loadingSuggestions}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors hover:bg-white/10 disabled:opacity-40 cursor-pointer"
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
        <div className="flex justify-between items-center mt-1.5 gap-3">
          <span className="text-xs text-white/35">Output language follows your input language</span>
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
                className="px-3 py-1.5 text-xs rounded-full border transition-all hover:border-[#6c8cff]/60 hover:bg-[#6c8cff]/10 cursor-pointer"
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

  /* ─── Generate button with outer glow ─── */
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

      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        {/* ── Tab navigation ── */}
        <div className="mb-8">
          <div className="flex gap-1 flex-wrap border-b" style={{ borderColor: border }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setSuggestions([]); }}
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
            Social Posts tab
            ════════════════════════════════════════════════ */}
        {activeTab === "social_posts" && (
          <>
            <GlowCard glowColor="blue" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-7">
                <PillSelector label="Platform" options={socialPlatforms} value={spPlatform} onChange={setSpPlatform} />
                <TopicInput
                  value={spTopic}
                  onChange={handleSpTopicChange}
                  placeholder="e.g. Why small businesses need a content strategy"
                />
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2.5" style={{ color: textPrimary }}>Number of posts</label>
                  <div className="flex gap-2">
                    {postCounts.map((n) => (
                      <button
                        key={n}
                        onClick={() => setSpNumPosts(n)}
                        className="w-12 h-10 text-sm rounded-lg border transition-all cursor-pointer"
                        style={{
                          backgroundColor: spNumPosts === n ? "rgba(108,140,255,0.1)" : "transparent",
                          borderColor: spNumPosts === n ? accent : border,
                          color: spNumPosts === n ? accent : textMuted,
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
              </div>
            </GlowCard>
            {spLoading && <LoadingSkeleton message="Generating your posts..." />}
            {!spLoading && <OutputCards cards={splitCards(spOutput)} copiedIdx={spCopied} onCopy={(t, i) => handleCopy(t, i, setSpCopied)} accent={accent} accentLight={accentLight} contentType="social_posts" />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Ad Copy tab
            ════════════════════════════════════════════════ */}
        {activeTab === "ad_copy" && (
          <>
            <GlowCard glowColor="blue" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-7">
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
              </div>
            </GlowCard>
            {acLoading && <LoadingSkeleton message="Generating ad variations..." />}
            {!acLoading && <OutputCards cards={splitCards(acOutput)} copiedIdx={acCopied} onCopy={(t, i) => handleCopy(t, i, setAcCopied)} accent={accent} accentLight={accentLight} contentType="ad_copy" />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Landing Page tab
            ════════════════════════════════════════════════ */}
        {activeTab === "landing_page" && (
          <>
            <GlowCard glowColor="blue" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-7">
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
              </div>
            </GlowCard>
            {lpLoading && <LoadingSkeleton message="Generating landing page copy..." />}
            {!lpLoading && <OutputCards cards={splitCards(lpOutput)} copiedIdx={lpCopied} onCopy={(t, i) => handleCopy(t, i, setLpCopied)} accent={accent} accentLight={accentLight} contentType="landing_page" />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Email Campaign tab
            ════════════════════════════════════════════════ */}
        {activeTab === "email_campaign" && (
          <>
            <GlowCard glowColor="blue" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-7">
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
              </div>
            </GlowCard>
            {ecLoading && <LoadingSkeleton message="Generating your email..." />}
            {!ecLoading && <OutputCards cards={splitCards(ecOutput)} copiedIdx={ecCopied} onCopy={(t, i) => handleCopy(t, i, setEcCopied)} accent={accent} accentLight={accentLight} contentType="email_campaign" />}
          </>
        )}

        {/* ════════════════════════════════════════════════
            Content Brief tab
            ════════════════════════════════════════════════ */}
        {activeTab === "content_brief" && (
          <>
            <GlowCard glowColor="blue" className="mb-6">
              <div className="overflow-hidden" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "14px 14px 0 0" }} />
              <div className="p-7">
                <PillSelector label="Content type" options={contentTypes} value={cbType} onChange={setCbType} />
                <TopicInput value={cbTopic} onChange={(v) => { setCbTopic(v); if (suggestions.length) setSuggestions([]); }} placeholder="e.g. How to build a personal brand in 2025" maxLen={2000} />
                <GenerateButton
                  loading={cbLoading}
                  disabled={!cbTopic.trim()}
                  onClick={() => callWorkflow("content_brief", { content_type: cbType, topic: cbTopic }, setCbLoading, setCbOutput, setCbError)}
                  label="Generate"
                />
                <ErrorMsg error={cbError} />
              </div>
              </div>
            </GlowCard>
            {cbLoading && <LoadingSkeleton message="Generating your brief..." />}
            {!cbLoading && <OutputCards cards={splitCards(cbOutput)} copiedIdx={cbCopied} onCopy={(t, i) => handleCopy(t, i, setCbCopied)} accent={accent} accentLight={accentLight} contentType="content_brief" />}
          </>
        )}
      </div>
    </div>
  );
}
