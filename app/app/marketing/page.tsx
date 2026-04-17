"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlowCard } from "@/components/ui/glow-card";
import { OutputCards } from "@/components/ui/output-cards";
import { StreamingCard } from "@/components/ui/streaming-card";
import { MULTI_OUTPUT_WORKFLOWS } from "@/lib/constants";
import { UpgradeModal, CREDIT_LIMIT_ERROR } from "@/components/upgrade-modal";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const accentLight = "#818cf8";
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

/* ─── Topic / Brief input with sparkle suggestions ─── */
function TopicInput({
  value,
  onChange,
  placeholder,
  maxLen = 600,
  multiline = false,
  label = "Topic",
  loadingSuggestions,
  onSuggest,
  suggestions,
  suggestDisabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLen?: number;
  multiline?: boolean;
  label?: string;
  loadingSuggestions: boolean;
  onSuggest: () => void;
  suggestions: string[];
  suggestDisabled?: boolean;
}) {
  const len = value.length;

  // 4-state feedback machine — evaluated once per value change, not per render
  const feedbackState = useMemo((): "short" | "good" | "detailed" | "approaching" => {
    if (len < 100) return "short";
    if (len < 400) return "good";
    if (len < 550) return "detailed";
    return "approaching";
  }, [len]);

  const counterColor = useMemo(() => {
    if (feedbackState === "good") return "#4ade80";
    if (feedbackState === "detailed") return textMuted;
    if (feedbackState === "approaching") return "#fb923c";
    return textMuted;
  }, [feedbackState]);

  const hintMessage = useMemo(() => {
    if (feedbackState === "short") return "Add context about your audience and positioning for better results.";
    if (feedbackState === "approaching") return "For persistent context (voice, positioning), use Brand Context in Settings.";
    return null;
  }, [feedbackState]);

  const inputBaseClass = "w-full px-4 py-3 pr-11 text-sm rounded-lg outline-none placeholder:text-slate-500 transition-shadow focus:ring-2 focus:ring-[#6c8cff]/40 focus:shadow-[0_0_0_1px_rgba(108,140,255,0.3)]";
  const inputBaseStyle = { backgroundColor: bg, border: `1px solid ${border}`, color: textPrimary };

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium mb-2.5" style={{ color: textPrimary }}>
        {label}
      </label>
      <div className="relative">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => { onChange(e.target.value.slice(0, maxLen)); }}
            rows={3}
            placeholder={placeholder}
            className={`${inputBaseClass} resize-none custom-scrollbar`}
            style={inputBaseStyle}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value.slice(0, maxLen)); }}
            placeholder={placeholder}
            className={inputBaseClass}
            style={inputBaseStyle}
          />
        )}
        <button
          type="button"
          onClick={suggestDisabled ? undefined : onSuggest}
          disabled={loadingSuggestions || suggestDisabled}
          className={`absolute right-2 p-1.5 rounded-md transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${multiline ? "top-3" : "top-1/2 -translate-y-1/2"}`}
          aria-label="Suggest topics"
          title={suggestDisabled ? "Upgrade to continue" : "Get AI topic ideas"}
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
      <div className="flex justify-between items-start mt-1.5 gap-3">
        <span className="text-xs transition-colors duration-300" style={{ color: hintMessage ? textMuted : "rgba(255,255,255,0.2)" }}>
          {hintMessage ?? "Output language follows your input language"}
        </span>
        <span className="text-[11px] tabular-nums flex-shrink-0 transition-colors duration-300" style={{ color: counterColor }}>
          {len}/{maxLen}
        </span>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onChange(s)}
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
  const [spStreaming, setSpStreaming] = useState(false);
  // Output is tracked per platform so switching between Instagram /
  // LinkedIn / Facebook preserves each one independently. Session-only
  // React state — nothing persists past a page refresh.
  const [spOutputs, setSpOutputs] = useState<Record<"instagram" | "linkedin" | "facebook", string | null>>({
    instagram: null,
    linkedin: null,
    facebook: null,
  });
  // Derived: the output for the currently-selected platform. Used by
  // the render path below exactly like the old `spOutput` state was.
  const spOutput = spOutputs[spPlatform];
  const [spError, setSpError] = useState<string | null>(null);
  const [spCopied, setSpCopied] = useState<number | null>(null);
  const spStreamTextRef = useRef<HTMLDivElement | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // null = still loading from API; false = credits available; true = limit reached
  const [creditLimitReached, setCreditLimitReached] = useState<boolean | null>(null);
  const [currentPlanKey, setCurrentPlanKey] = useState<string>("trial");

  // On mount, sync credit-limit state from server — always overwrite both directions.
  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => {
        const limited = d.limitReached ?? false;
        setCreditLimitReached(limited);
        if (d.planKey) setCurrentPlanKey(d.planKey);
        if (limited) setShowUpgradeModal(true);
      })
      .catch(() => { setCreditLimitReached(false); });
  }, []);

  /* ── Ad Copy state ── */
  const [acPlatform, setAcPlatform] = useState<"google_ads" | "facebook" | "instagram">("google_ads");
  const [acGoal, setAcGoal] = useState<"awareness" | "clicks" | "conversions">("clicks");
  const [acRegister, setAcRegister] = useState("warm_human");
  const [acTopic, setAcTopic] = useState("");
  const [acLoading, setAcLoading] = useState(false);
  const [acStreaming, setAcStreaming] = useState(false);
  const [acOutput, setAcOutput] = useState<string | null>(null);
  const [acError, setAcError] = useState<string | null>(null);
  const [acCopied, setAcCopied] = useState<number | null>(null);
  const acStreamTextRef = useRef<HTMLDivElement | null>(null);

  /* ── Landing Page state ── */
  const [lpSection, setLpSection] = useState<"hero" | "features" | "cta" | "faq" | "testimonial_prompt">("hero");
  const [lpGoal, setLpGoal] = useState<"lead_gen" | "sales" | "waitlist">("lead_gen");
  const [lpTopic, setLpTopic] = useState("");
  const [lpLoading, setLpLoading] = useState(false);
  const [lpStreaming, setLpStreaming] = useState(false);
  const [lpOutput, setLpOutput] = useState<string | null>(null);
  const [lpError, setLpError] = useState<string | null>(null);
  const [lpCopied, setLpCopied] = useState<number | null>(null);
  const lpStreamTextRef = useRef<HTMLDivElement | null>(null);

  /* ── Email Campaign state ── */
  const [ecType, setEcType] = useState<"welcome" | "promotional" | "nurture" | "re_engagement">("welcome");
  const [ecTopic, setEcTopic] = useState("");
  const [ecLoading, setEcLoading] = useState(false);
  const [ecStreaming, setEcStreaming] = useState(false);
  const [ecOutput, setEcOutput] = useState<string | null>(null);
  const [ecError, setEcError] = useState<string | null>(null);
  const [ecCopied, setEcCopied] = useState<number | null>(null);
  const ecStreamTextRef = useRef<HTMLDivElement | null>(null);

  /* ── Content Brief state ── */
  const [cbType, setCbType] = useState<"blog_post" | "video_script" | "podcast_episode">("blog_post");
  const [cbTopic, setCbTopic] = useState("");
  const [cbLoading, setCbLoading] = useState(false);
  const [cbStreaming, setCbStreaming] = useState(false);
  const [cbOutput, setCbOutput] = useState<string | null>(null);
  const [cbError, setCbError] = useState<string | null>(null);
  const [cbCopied, setCbCopied] = useState<number | null>(null);
  const cbStreamTextRef = useRef<HTMLDivElement | null>(null);

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
        body: JSON.stringify({ module_key: "marketing", workflow_key, input_json }),
      });

      // Error path — server returns JSON with a non-2xx status BEFORE
      // any streaming begins (auth, workspace, cap, unknown workflow).
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.error ?? "Something went wrong";
        setError(errorMsg);
        if (errorMsg === CREDIT_LIMIT_ERROR) {
          setCreditLimitReached(true);
          setShowUpgradeModal(true);
        }
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
      if (!full.trim()) {
        // Stream closed with zero content — the Claude API was overloaded
        // or returned an error silently. Surface it so the user knows to
        // retry rather than staring at a frozen screen.
        setError("Claude is currently overloaded — please wait a moment and try again.");
      } else {
        setOutput(full);
        window.dispatchEvent(new Event("recents:refresh"));
        fetch("/api/usage").then(r => r.json()).then(d => {
          setCreditLimitReached(d.limitReached ?? false);
          if (d.planKey) setCurrentPlanKey(d.planKey);
        }).catch(() => {});
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }

  function splitCards(raw: string | null, workflowKey: string) {
    if (!raw) return [];
    if (MULTI_OUTPUT_WORKFLOWS.has(workflowKey)) {
      return raw.split(/\n---\n/).map((p) => p.trim()).filter(Boolean);
    }
    return [raw.trim()]; // single-document workflows — one card
  }

  const handleCopy = useCallback(async (text: string, idx: number, setter: (n: number | null) => void) => {
    await navigator.clipboard.writeText(text);
    setter(idx);
    setTimeout(() => setter(null), 2000);
  }, []);

  /* ─── Build full suggestion context based on active tab ─── */
  function getSuggestInput(): Record<string, string> {
    if (activeTab === "social_posts") {
      return { platform: spPlatform };
    }
    if (activeTab === "ad_copy") {
      const platform = acPlatform === "facebook" ? "facebook" : acPlatform === "instagram" ? "instagram" : "google_ads";
      return { platform, ad_goal: acGoal };
    }
    if (activeTab === "landing_page") {
      return { platform: "linkedin", lp_section: lpSection, lp_goal: lpGoal };
    }
    if (activeTab === "email_campaign") {
      return { platform: "linkedin", email_type: ecType };
    }
    if (activeTab === "content_brief") {
      return { platform: "linkedin", content_type: cbType };
    }
    return { platform: "linkedin" };
  }

  async function handleSuggest() {
    // Don't allow sparkle when credit limit has been reached.
    if (creditLimitReached) {
      setShowUpgradeModal(true);
      return;
    }
    setLoadingSuggestions(true);
    setSuggestions([]);
    // Abort after 20 s so the spinner never gets stuck forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_key: "marketing", workflow_key: "topic_suggestions", input_json: getSuggestInput() }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (res.ok && data.output_markdown) {
        // Strip markdown code fences that the model may wrap around the JSON.
        // Handles ```json ... ```, ``` ... ```, and bare arrays.
        const raw = data.output_markdown.trim();
        const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const cleaned = (fenceMatch ? fenceMatch[1] : raw).trim();
        try {
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) setSuggestions(parsed);
        } catch {
          // Model returned non-JSON — silently ignore, user can type manually.
          console.warn("[topic_suggestions] could not parse response:", cleaned.slice(0, 100));
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.warn("[topic_suggestions] timed out after 20 s");
      } else {
        console.error("[topic_suggestions] error:", err);
      }
    } finally {
      clearTimeout(timeout);
      setLoadingSuggestions(false);
    }
  }

  /* ─── Social Posts handlers ─── */
  function handleSpGenerate() {
    if (!spTopic.trim()) return;
    // Capture the platform at click time so if the user switches
    // platforms mid-stream the completed output still lands on the
    // platform they actually generated for.
    const platform = spPlatform;
    const setOutputForPlatform = (value: string | null) => {
      setSpOutputs((prev) => ({ ...prev, [platform]: value }));
    };
    callWorkflow("social_posts", { platform, topic: spTopic, num_posts: spNumPosts }, setSpLoading, setOutputForPlatform, setSpError, setSpStreaming, spStreamTextRef);
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
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: bg }}>
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
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: textPrimary }}>
            {tabDescriptions[activeTab].title}
          </h1>
          <p className="text-base mt-1.5" style={{ color: textMuted }}>
            {tabDescriptions[activeTab].subtitle}
          </p>
        </div>

        {/* ── Brand context notice ── */}
        <div
          className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 mb-6 text-xs"
          style={{ backgroundColor: "rgba(108,140,255,0.06)", border: "1px solid rgba(108,140,255,0.12)", color: textMuted }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5" style={{ color: accent, opacity: 0.7 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>
            Outputs use your brand profile from{" "}
            <a href="/app/settings" className="underline underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: accent }}>
              Settings
            </a>
            . If you&apos;re generating for a different brand or product, update your profile first or include relevant context directly in the topic field.
          </span>
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
                  loadingSuggestions={loadingSuggestions}
                  onSuggest={handleSuggest}
                  suggestions={suggestions}
                  suggestDisabled={creditLimitReached === true}
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
                <GenerateButton loading={spLoading} disabled={!spTopic.trim()} onClick={() => { if (creditLimitReached) { setShowUpgradeModal(true); return; } handleSpGenerate(); }} label="Generate" />
                <ErrorMsg error={spError} />
              </div>
              </div>
            </GlowCard>
            {spLoading && !spStreaming && <LoadingSkeleton message="Generating your posts..." />}
            <StreamingCard ref={spStreamTextRef} visible={spStreaming} accent={accent} accentLight={accentLight} />
            {!spLoading && !spStreaming && <OutputCards cards={splitCards(spOutput, 'social_posts')} copiedIdx={spCopied} onCopy={(t, i) => handleCopy(t, i, setSpCopied)} accent={accent} accentLight={accentLight} contentType="social_posts" onClear={() => { setSpOutputs({ instagram: null, linkedin: null, facebook: null }); setSpError(null); }} />}
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

                {/* Voice Register */}
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2.5" style={{ color: textPrimary }}>Voice register</label>
                  <select
                    value={acRegister}
                    onChange={(e) => setAcRegister(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none focus:ring-2 focus:ring-[#6c8cff]/40 cursor-pointer"
                    style={{ backgroundColor: bg, border: `1px solid ${border}`, color: textPrimary, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                  >
                    <option value="warm_human">Warm &amp; human — Mailchimp, Notion</option>
                    <option value="dry_understated">Dry &amp; understated — Basecamp, Linear</option>
                    <option value="punchy_confident">Punchy &amp; confident — Stripe, Vercel</option>
                    <option value="playful_sharp">Playful &amp; sharp — Slack, Oatly</option>
                    <option value="poetic_considered">Poetic &amp; considered — Apple, Arc</option>
                  </select>
                </div>

                <TopicInput
                  value={acTopic}
                  onChange={(v) => { setAcTopic(v); if (suggestions.length) setSuggestions([]); }}
                  label="Brief"
                  multiline={true}
                  placeholder={"e.g. Launching our new AI automation module for SaaS solopreneurs. Target: solo founders losing time on repetitive tasks. Key message: saves 10+ hours per week."}
                  loadingSuggestions={loadingSuggestions}
                  onSuggest={handleSuggest}
                  suggestions={suggestions}
                  suggestDisabled={creditLimitReached === true}
                />
                <GenerateButton
                  loading={acLoading}
                  disabled={!acTopic.trim()}
                  onClick={() => { if (creditLimitReached) { setShowUpgradeModal(true); return; } callWorkflow("ad_copy", { platform: acPlatform, goal: acGoal, topic: acTopic, register: acRegister }, setAcLoading, setAcOutput, setAcError, setAcStreaming, acStreamTextRef); }}
                  label="Generate"
                />
                <ErrorMsg error={acError} />
              </div>
              </div>
            </GlowCard>
            {acLoading && !acStreaming && <LoadingSkeleton message="Generating ad variations..." />}
            <StreamingCard ref={acStreamTextRef} visible={acStreaming} accent={accent} accentLight={accentLight} />
            {!acLoading && !acStreaming && <OutputCards cards={splitCards(acOutput, 'ad_copy')} copiedIdx={acCopied} onCopy={(t, i) => handleCopy(t, i, setAcCopied)} accent={accent} accentLight={accentLight} contentType="ad_copy" onClear={() => { setAcOutput(null); setAcError(null); }} />}
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
                <TopicInput value={lpTopic} onChange={(v) => { setLpTopic(v); if (suggestions.length) setSuggestions([]); }} placeholder="e.g. AI-powered project management tool" maxLen={300} loadingSuggestions={loadingSuggestions} onSuggest={handleSuggest} suggestions={suggestions} suggestDisabled={creditLimitReached === true} />
                <GenerateButton
                  loading={lpLoading}
                  disabled={!lpTopic.trim()}
                  onClick={() => { if (creditLimitReached) { setShowUpgradeModal(true); return; } callWorkflow("landing_page", { section: lpSection, goal: lpGoal, topic: lpTopic }, setLpLoading, setLpOutput, setLpError, setLpStreaming, lpStreamTextRef); }}
                  label="Generate"
                />
                <ErrorMsg error={lpError} />
              </div>
              </div>
            </GlowCard>
            {lpLoading && !lpStreaming && <LoadingSkeleton message="Generating landing page copy..." />}
            <StreamingCard ref={lpStreamTextRef} visible={lpStreaming} accent={accent} accentLight={accentLight} />
            {!lpLoading && !lpStreaming && <OutputCards cards={splitCards(lpOutput, 'landing_page')} copiedIdx={lpCopied} onCopy={(t, i) => handleCopy(t, i, setLpCopied)} accent={accent} accentLight={accentLight} contentType="landing_page" onClear={() => { setLpOutput(null); setLpError(null); }} />}
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
                <TopicInput value={ecTopic} onChange={(v) => { setEcTopic(v); if (suggestions.length) setSuggestions([]); }} placeholder="e.g. New feature launch announcement" maxLen={300} loadingSuggestions={loadingSuggestions} onSuggest={handleSuggest} suggestions={suggestions} suggestDisabled={creditLimitReached === true} />
                <GenerateButton
                  loading={ecLoading}
                  disabled={!ecTopic.trim()}
                  onClick={() => { if (creditLimitReached) { setShowUpgradeModal(true); return; } callWorkflow("email_campaign", { email_type: ecType, topic: ecTopic }, setEcLoading, setEcOutput, setEcError, setEcStreaming, ecStreamTextRef); }}
                  label="Generate"
                />
                <ErrorMsg error={ecError} />
              </div>
              </div>
            </GlowCard>
            {ecLoading && !ecStreaming && <LoadingSkeleton message="Generating your email..." />}
            <StreamingCard ref={ecStreamTextRef} visible={ecStreaming} accent={accent} accentLight={accentLight} />
            {!ecLoading && !ecStreaming && <OutputCards cards={splitCards(ecOutput, 'email_campaign')} copiedIdx={ecCopied} onCopy={(t, i) => handleCopy(t, i, setEcCopied)} accent={accent} accentLight={accentLight} contentType="email_campaign" onClear={() => { setEcOutput(null); setEcError(null); }} />}
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
                <TopicInput value={cbTopic} onChange={(v) => { setCbTopic(v); if (suggestions.length) setSuggestions([]); }} placeholder="e.g. How to build a personal brand in 2025" maxLen={2000} loadingSuggestions={loadingSuggestions} onSuggest={handleSuggest} suggestions={suggestions} suggestDisabled={creditLimitReached === true} />
                <GenerateButton
                  loading={cbLoading}
                  disabled={!cbTopic.trim()}
                  onClick={() => { if (creditLimitReached) { setShowUpgradeModal(true); return; } callWorkflow("content_brief", { content_type: cbType, topic: cbTopic }, setCbLoading, setCbOutput, setCbError, setCbStreaming, cbStreamTextRef); }}
                  label="Generate"
                />
                <ErrorMsg error={cbError} />
              </div>
              </div>
            </GlowCard>
            {cbLoading && !cbStreaming && <LoadingSkeleton message="Generating your brief..." />}
            <StreamingCard ref={cbStreamTextRef} visible={cbStreaming} accent={accent} accentLight={accentLight} />
            {!cbLoading && !cbStreaming && <OutputCards cards={splitCards(cbOutput, 'content_brief')} copiedIdx={cbCopied} onCopy={(t, i) => handleCopy(t, i, setCbCopied)} accent={accent} accentLight={accentLight} contentType="content_brief" onClear={() => { setCbOutput(null); setCbError(null); }} />}
          </>
        )}
      </div>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} planKey={currentPlanKey} />
    </div>
  );
}
