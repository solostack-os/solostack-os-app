"use client";

import Link from "next/link";

/* ─── Design tokens (match Settings page) ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const accentLight = "#818cf8";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

/* ─── Sub-processor data ─── */
const processors = [
  {
    name: "Anthropic",
    purpose: "AI text generation (primary LLM provider)",
    data: "Your prompts and brand profile context",
    training:
      "Not used to train Anthropic\u2019s models (per their commercial API terms)",
    dpa: "anthropic.com/legal/dpa",
  },
  {
    name: "OpenAI",
    purpose: "AI text generation (fallback when Anthropic is overloaded)",
    data: "Your prompts and brand profile context",
    training:
      "Not used to train OpenAI\u2019s models (per their API data usage policy, March 2023+)",
    dpa: "openai.com/policies/data-processing-addendum",
  },
  {
    name: "Supabase",
    purpose: "Database, authentication, file storage",
    data: "Your account, brand profile, generation history",
    training: "N/A (database, not AI)",
    dpa: "supabase.com/legal/dpa",
  },
  {
    name: "Vercel",
    purpose: "Application hosting and edge delivery",
    data: "Network requests (no persistent data storage)",
    training: "N/A",
    dpa: "vercel.com/legal/dpa",
  },
];

export default function SubProcessorsPage() {
  return (
    <div
      className="min-h-screen px-4 py-12 sm:px-6"
      style={{ backgroundColor: bg }}
    >
      <div className="mx-auto max-w-2xl">
        {/* ─── Back link ─── */}
        <Link
          href="/app/settings"
          className="inline-flex items-center gap-1.5 text-xs mb-8 transition-colors"
          style={{ color: textMuted }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = textMuted;
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Settings
        </Link>

        {/* ─── Header ─── */}
        <h1
          className="text-2xl font-semibold tracking-tight mb-2"
          style={{ color: textPrimary }}
        >
          Sub-Processors
        </h1>
        <p className="text-sm leading-relaxed mb-10" style={{ color: textMuted }}>
          Third-party services that help us deliver SoloStack. We choose
          providers with strong security postures and DPAs in place.
        </p>

        {/* ─── Provider cards ─── */}
        <div className="flex flex-col gap-5">
          {processors.map((p) => (
            <div
              key={p.name}
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: surface, borderColor: border }}
            >
              <div
                className="h-[2px]"
                style={{
                  background: `linear-gradient(90deg, ${accent}, ${accentLight})`,
                }}
              />
              <div className="p-7">
                <h2
                  className="text-base font-semibold mb-4"
                  style={{ color: textPrimary }}
                >
                  {p.name}
                </h2>

                <div className="grid gap-3 text-sm">
                  <Row label="Purpose" value={p.purpose} />
                  <Row label="Data processed" value={p.data} />
                  <Row label="AI training" value={p.training} />
                  <Row
                    label="DPA"
                    value={
                      <a
                        href={`https://${p.dpa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 transition-colors"
                        style={{ color: accent }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = accentLight;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = accent;
                        }}
                      >
                        {p.dpa}
                      </a>
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Footer note ─── */}
        <p
          className="mt-10 text-xs leading-relaxed"
          style={{ color: "#475569" }}
        >
          This list is current as of May 4, 2025. We notify users via email
          30&nbsp;days before adding any new sub-processor that handles personal
          data.
        </p>
      </div>
    </div>
  );
}

/* ─── Shared row component ─── */
function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span
        className="shrink-0 w-[110px] font-medium"
        style={{ color: textMuted }}
      >
        {label}
      </span>
      <span style={{ color: textPrimary }}>{value}</span>
    </div>
  );
}
