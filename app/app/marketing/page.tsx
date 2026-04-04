"use client";

import { useState } from "react";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.08)";

const platforms = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
] as const;

const postCounts = [1, 2, 3] as const;

export default function MarketingPage() {
  const [platform, setPlatform] = useState<"instagram" | "linkedin" | "facebook">("linkedin");
  const [topic, setTopic] = useState("");
  const [numPosts, setNumPosts] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setOutput(null);
    setError(null);

    const res = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module_key: "marketing",
        workflow_key: "social_posts",
        input_json: { platform, topic, num_posts: numPosts },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    setOutput(data.output_markdown);
    setLoading(false);
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/app/dashboard"
            className="text-xs font-medium mb-4 inline-block hover:underline"
            style={{ color: textMuted }}
          >
            &larr; Dashboard
          </a>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Create social media posts
          </h1>
          <p className="text-sm mt-1" style={{ color: textMuted }}>
            Generate platform-ready posts using your business context.
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-xl p-6 border mb-6"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          {/* Platform selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
              Platform
            </label>
            <div className="flex gap-2">
              {platforms.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className="px-4 py-2 text-sm rounded-lg border transition-all"
                  style={{
                    backgroundColor: platform === p.value ? "rgba(108,140,255,0.1)" : "transparent",
                    borderColor: platform === p.value ? accent : border,
                    color: platform === p.value ? accent : textMuted,
                    boxShadow: platform === p.value ? `0 0 0 1px ${accent}` : "none",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic input */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
              What should the posts be about?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Why small businesses need a content strategy"
              className="w-full px-4 py-3 text-sm rounded-lg outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#6c8cff]/50"
              style={{
                backgroundColor: bg,
                border: `1px solid ${border}`,
                color: textPrimary,
              }}
            />
          </div>

          {/* Number of posts */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
              Number of posts
            </label>
            <div className="flex gap-2">
              {postCounts.map((n) => (
                <button
                  key={n}
                  onClick={() => setNumPosts(n)}
                  className="w-12 h-10 text-sm rounded-lg border transition-all"
                  style={{
                    backgroundColor: numPosts === n ? "rgba(108,140,255,0.1)" : "transparent",
                    borderColor: numPosts === n ? accent : border,
                    color: numPosts === n ? accent : textMuted,
                    boxShadow: numPosts === n ? `0 0 0 1px ${accent}` : "none",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full py-3 text-sm font-medium rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: accent, color: bg }}
          >
            {loading ? "Generating your posts..." : "Generate"}
          </button>

          {error && (
            <p className="text-sm mt-3 text-center" style={{ color: "#f87171" }}>
              {error}
            </p>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div
            className="rounded-xl p-6 border"
            style={{ backgroundColor: surface, borderColor: border }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: accent, borderTopColor: "transparent" }}
              />
              <span className="text-sm" style={{ color: textMuted }}>
                Generating your posts...
              </span>
            </div>
            <div className="space-y-3">
              <div className="h-4 rounded w-full animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
              <div className="h-4 rounded w-5/6 animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
              <div className="h-4 rounded w-4/6 animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
            </div>
          </div>
        )}

        {/* Output */}
        {output && !loading && (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: surface, borderColor: border }}
          >
            {/* Output header */}
            <div
              className="flex items-center justify-between px-6 py-3 border-b"
              style={{ borderColor: border }}
            >
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textMuted }}>
                Output
              </span>
              <button
                onClick={handleCopy}
                className="text-xs font-medium px-3 py-1 rounded border transition-colors hover:border-white/20"
                style={{
                  color: copied ? "#5eead4" : textMuted,
                  borderColor: copied ? "rgba(94,234,212,0.3)" : border,
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Markdown output — rendered as pre-formatted with whitespace preserved */}
            <div
              className="px-6 py-5 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: textPrimary }}
            >
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
