"use client";

import { useState, useEffect, useCallback } from "react";
import { GlowCard } from "@/components/ui/glow-card";

/* ─── Design tokens (exact match with app) ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const border = "rgba(255,255,255,0.06)";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";

/* ─── Module colors (exact match with app sidebar) ─── */
const moduleThemes = {
  marketing: { accent: "#6c8cff", light: "#818cf8", label: "Marketing OS" },
  outreach: { accent: "#22c55e", light: "#34d399", label: "Outreach OS" },
  operations: { accent: "#f97316", light: "#fb923c", label: "Operations OS" },
};

/* ─── Sparkle icon (exact match with app TopicInput) ─── */
function SparkleIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke={color}
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
      />
    </svg>
  );
}

/* ─── Demo scenarios — each mimics the real app form ─── */
interface DemoScenario {
  moduleKey: "marketing" | "outreach" | "operations";
  workflow: string;
  fields: Array<
    | { type: "pills"; label: string; options: string[]; selected: number }
    | { type: "topic"; label: string; value: string; placeholder: string }
    | { type: "text"; label: string; value: string; placeholder: string }
    | { type: "number"; label: string; options: string[]; selected: number }
  >;
  outputs: Array<{ label: string; text: string }>;
}

const demos: DemoScenario[] = [
  {
    moduleKey: "marketing",
    workflow: "Social Posts",
    fields: [
      {
        type: "pills",
        label: "Platform",
        options: ["Instagram", "LinkedIn", "Facebook"],
        selected: 1,
      },
      {
        type: "topic",
        label: "Topic",
        value: "Launch announcement for our new brand strategy service",
        placeholder: "e.g. Why small businesses need a content strategy",
      },
      {
        type: "number",
        label: "Number of posts",
        options: ["1", "2", "3"],
        selected: 1,
      },
    ],
    outputs: [
      {
        label: "Post 1",
        text: "We just launched something we\u2019ve been building for months. Brand strategy for service businesses who want clarity, not templates. If you\u2019re tired of guessing your next move \u2014 this is for you.",
      },
      {
        label: "Post 2",
        text: "Most solo founders skip brand strategy because it sounds expensive and abstract. We made it practical: clear positioning, real messaging, and a plan you can actually execute on. Starting at $1,500.",
      },
    ],
  },
  {
    moduleKey: "outreach",
    workflow: "Cold Email",
    fields: [
      {
        type: "text",
        label: "Prospect name",
        value: "Sarah Chen",
        placeholder: "e.g. Sarah Chen",
      },
      {
        type: "text",
        label: "Role",
        value: "VP of Marketing",
        placeholder: "e.g. VP of Marketing",
      },
      {
        type: "text",
        label: "Company",
        value: "Bloom Studio",
        placeholder: "e.g. Acme Corp",
      },
      {
        type: "pills",
        label: "Goal",
        options: ["Book a call", "Get a reply", "Share a resource"],
        selected: 0,
      },
    ],
    outputs: [
      {
        label: "Subject",
        text: "Quick question about Bloom\u2019s content pipeline",
      },
      {
        label: "Email",
        text: "Hi Sarah,\n\nI noticed Bloom Studio shifted toward video-first content this quarter \u2014 smart move for the agency space.\n\nWe help marketing teams turn one content brief into a full cross-platform campaign without the back-and-forth. Figured it might be worth a quick 15-minute call?\n\nHappy to share how it works if you\u2019re open to it.",
      },
    ],
  },
  {
    moduleKey: "operations",
    workflow: "Client Onboarding",
    fields: [
      {
        type: "text",
        label: "Client name",
        value: "Meridian Consulting",
        placeholder: "e.g. Bloom Skincare",
      },
      {
        type: "text",
        label: "Service type",
        value: "Brand identity",
        placeholder: "e.g. Brand identity",
      },
      {
        type: "text",
        label: "Start date",
        value: "May 1, 2026",
        placeholder: "e.g. May 1, 2025",
      },
    ],
    outputs: [
      {
        label: "Timeline",
        text: "Week 1\u20132: Discovery & brand audit\nWeek 3\u20134: Strategy & concept development\nWeek 5: Refinement & revisions\nWeek 6: Final delivery & handoff",
      },
      {
        label: "Next steps",
        text: "1. Schedule kickoff call (before May 1)\n2. Share existing brand assets via shared folder\n3. Complete brand intake questionnaire\n4. Confirm milestone review dates",
      },
    ],
  },
];

/* ─── Timing constants ─── */
const TYPING_SPEED = 30;
const PAUSE_AFTER_TYPING = 500;
const GENERATING_DURATION = 1400;
const OUTPUT_STAGGER = 300;
const DISPLAY_DURATION = 4500;

export function HeroDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"filling" | "generating" | "output">("filling");
  const [fillProgress, setFillProgress] = useState(0);
  const [visibleOutputs, setVisibleOutputs] = useState(0);

  const demo = demos[activeIndex];
  const theme = moduleThemes[demo.moduleKey];

  // Find the typing field (topic or last text field)
  const typingFieldIndex = demo.fields.findIndex((f) => f.type === "topic");
  const actualTypingIndex =
    typingFieldIndex >= 0
      ? typingFieldIndex
      : demo.fields.reduce(
          (last, f, i) => (f.type === "text" ? i : last),
          0
        );
  const typingField = demo.fields[actualTypingIndex];
  const typingValue = "value" in typingField ? typingField.value : "";

  const advanceToNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % demos.length);
    setPhase("filling");
    setFillProgress(0);
    setVisibleOutputs(0);
  }, []);

  // Filling (typing) phase
  useEffect(() => {
    if (phase !== "filling") return;
    if (fillProgress >= typingValue.length) {
      const t = setTimeout(() => setPhase("generating"), PAUSE_AFTER_TYPING);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setFillProgress((p) => p + 1), TYPING_SPEED);
    return () => clearTimeout(t);
  }, [phase, fillProgress, typingValue.length]);

  // Generating phase
  useEffect(() => {
    if (phase !== "generating") return;
    const t = setTimeout(() => setPhase("output"), GENERATING_DURATION);
    return () => clearTimeout(t);
  }, [phase]);

  // Output phase
  useEffect(() => {
    if (phase !== "output") return;
    if (visibleOutputs < demo.outputs.length) {
      const t = setTimeout(
        () => setVisibleOutputs((v) => v + 1),
        visibleOutputs === 0 ? 150 : OUTPUT_STAGGER
      );
      return () => clearTimeout(t);
    }
    const t = setTimeout(advanceToNext, DISPLAY_DURATION);
    return () => clearTimeout(t);
  }, [phase, visibleOutputs, demo.outputs.length, advanceToNext]);

  const showForm = phase === "filling" || phase === "generating";

  return (
    <div className="w-full max-w-md lg:max-w-lg">
      <GlowCard>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: surface }}>
          {/* ── Top bar (app-style window chrome) ── */}
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: `1px solid ${border}` }}
          >
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/10" />
              <span className="w-2 h-2 rounded-full bg-white/10" />
              <span className="w-2 h-2 rounded-full bg-white/10" />
            </div>
            <img src="/logo.png" alt="" className="h-4 w-4 object-contain ml-1.5" />
            <span className="text-[11px] font-medium" style={{ color: theme.accent }}>
              {theme.label}
            </span>
            <span className="text-[11px]" style={{ color: textMuted }}>
              / {demo.workflow}
            </span>
          </div>

          {/* ── Accent gradient bar (like real app GlowCard) ── */}
          <div
            className="h-[2px]"
            style={{
              background: `linear-gradient(90deg, ${theme.accent}, ${theme.light})`,
            }}
          />

          {/* ── Form / Output area ── */}
          <div className="p-4 sm:p-5">
            {showForm ? (
              /* ── FORM FIELDS (mimics real app layout) ── */
              <div className="space-y-4">
                {demo.fields.map((field, fi) => (
                  <div key={`${activeIndex}-${fi}`}>
                    {/* Label */}
                    <p
                      className="text-[12px] font-medium mb-1.5"
                      style={{ color: textPrimary }}
                    >
                      {field.label}
                    </p>

                    {/* Pills */}
                    {field.type === "pills" && (
                      <div className="flex flex-wrap gap-1.5">
                        {field.options.map((opt, oi) => (
                          <span
                            key={opt}
                            className="px-3 py-1.5 text-[11px] rounded-lg border transition-all"
                            style={{
                              backgroundColor:
                                oi === field.selected
                                  ? `${theme.accent}18`
                                  : "transparent",
                              borderColor:
                                oi === field.selected
                                  ? theme.accent
                                  : border,
                              color:
                                oi === field.selected
                                  ? theme.accent
                                  : textMuted,
                            }}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Number selector */}
                    {field.type === "number" && (
                      <div className="flex gap-1.5">
                        {field.options.map((opt, oi) => (
                          <span
                            key={opt}
                            className="w-9 h-8 flex items-center justify-center text-[12px] rounded-lg border transition-all"
                            style={{
                              backgroundColor:
                                oi === field.selected
                                  ? `${theme.accent}18`
                                  : "transparent",
                              borderColor:
                                oi === field.selected
                                  ? theme.accent
                                  : border,
                              color:
                                oi === field.selected
                                  ? theme.accent
                                  : textMuted,
                            }}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Topic input with sparkle */}
                    {field.type === "topic" && (
                      <div>
                        <div
                          className="relative rounded-lg px-3 py-2 text-[12px] leading-relaxed"
                          style={{
                            backgroundColor: bg,
                            border: `1px solid ${border}`,
                            color: textPrimary,
                          }}
                        >
                          {fi === actualTypingIndex ? (
                            <>
                              {typingValue.slice(0, fillProgress)}
                              <span
                                className="inline-block w-[2px] h-[0.9em] ml-0.5 align-middle animate-cursor-blink"
                                style={{ backgroundColor: theme.accent }}
                              />
                            </>
                          ) : (
                            <span style={{ color: textMuted }}>{field.placeholder}</span>
                          )}
                          {/* Sparkle button */}
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50">
                            <SparkleIcon color={theme.accent} />
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px]" style={{ color: textMuted }}>
                            Output language follows your input language
                          </span>
                          <span
                            className="text-[10px] tabular-nums"
                            style={{ color: textMuted }}
                          >
                            {fi === actualTypingIndex ? fillProgress : 0}/200
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Text input */}
                    {field.type === "text" && (
                      <div
                        className="rounded-lg px-3 py-2 text-[12px] leading-relaxed min-h-[34px]"
                        style={{
                          backgroundColor: bg,
                          border: `1px solid ${border}`,
                          color: textPrimary,
                        }}
                      >
                        {fi === actualTypingIndex ? (
                          <>
                            {typingValue.slice(0, fillProgress)}
                            <span
                              className="inline-block w-[2px] h-[0.9em] ml-0.5 align-middle animate-cursor-blink"
                              style={{ backgroundColor: theme.accent }}
                            />
                          </>
                        ) : (
                          <span style={{ color: textPrimary }}>{field.value}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* ── Generate button (exact app style: gradient + glow) ── */}
                <div className="relative group mt-1">
                  {phase !== "generating" && (
                    <div
                      className="absolute -inset-1 rounded-2xl blur-xl opacity-40"
                      style={{
                        background: `linear-gradient(135deg, ${theme.accent}, ${theme.light})`,
                      }}
                    />
                  )}
                  <div
                    className="relative w-full py-3 text-[13px] font-semibold rounded-xl text-center text-white flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accent}, ${theme.light})`,
                      opacity: phase === "generating" ? 0.6 : 1,
                    }}
                  >
                    {phase === "generating" ? (
                      <>
                        <span
                          className="h-3.5 w-3.5 rounded-full border-2 animate-spin"
                          style={{
                            borderColor: "rgba(255,255,255,0.3)",
                            borderTopColor: "#fff",
                          }}
                        />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ── OUTPUT CARDS (mimics real app output) ── */
              <div>
                {/* Output header */}
                <div className="flex justify-between items-center px-0.5 mb-3">
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider"
                    style={{ color: textMuted }}
                  >
                    Output
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: textMuted }}
                  >
                    Copy
                  </span>
                </div>

                <div className="space-y-2.5">
                  {demo.outputs.map((output, i) => (
                    <div
                      key={`${activeIndex}-out-${i}`}
                      className="rounded-xl overflow-hidden transition-all duration-400"
                      style={{
                        backgroundColor: surface,
                        border: `1px solid ${border}`,
                        opacity: i < visibleOutputs ? 1 : 0,
                        transform:
                          i < visibleOutputs
                            ? "translateY(0)"
                            : "translateY(8px)",
                      }}
                    >
                      {/* Gradient bar */}
                      <div
                        className="h-[2px]"
                        style={{
                          background: `linear-gradient(90deg, ${theme.accent}, ${theme.light})`,
                        }}
                      />
                      <div className="px-4 py-3">
                        <p
                          className="text-[9px] font-medium uppercase tracking-wider mb-1.5"
                          style={{ color: theme.accent }}
                        >
                          {output.label}
                        </p>
                        <p
                          className="text-[12px] leading-relaxed whitespace-pre-wrap"
                          style={{ color: textPrimary }}
                        >
                          {output.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </GlowCard>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {demos.map((d, i) => (
          <span
            key={d.moduleKey}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                i === activeIndex
                  ? moduleThemes[d.moduleKey].accent
                  : "rgba(255,255,255,0.15)",
              transform: i === activeIndex ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Inline keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes cursor-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .animate-cursor-blink {
            animation: cursor-blink 0.8s step-end infinite;
          }
        `,
        }}
      />
    </div>
  );
}
