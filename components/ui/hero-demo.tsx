"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

/* ─── Cursor SVG (macOS-style pointer) ─── */
function CursorIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M5.65 1.15 21.05 12.9h-8.35l4.5 8.5-3.2 1.6-4.3-8.75L5.65 18.3V1.15Z"
        fill="#fff"
        stroke="#000"
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Demo scenarios — each mimics the real app form ─── */
interface DemoScenario {
  moduleKey: "marketing" | "outreach" | "operations";
  workflow: string;
  /* Marketing demo uses special cursor-driven flow */
  useCursorFlow?: boolean;
  fields: Array<
    | { type: "pills"; label: string; options: string[]; selected: number }
    | { type: "topic"; label: string; value: string; placeholder: string }
    | { type: "text"; label: string; value: string; placeholder: string }
    | { type: "number"; label: string; options: string[]; selected: number }
  >;
  /* Suggestions that appear when sparkle is clicked (marketing only) */
  suggestions?: string[];
  outputs: Array<{ label: string; text: string }>;
}

const demos: DemoScenario[] = [
  {
    moduleKey: "marketing",
    workflow: "Social Posts",
    useCursorFlow: true,
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
    suggestions: [
      "Launch announcement for our new brand strategy service",
      "How to stand out in a crowded market",
      "5 signs your brand needs a refresh",
      "Why consistency beats creativity in branding",
      "Behind the scenes of a rebrand project",
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

/* ─── Cursor flow timing (marketing demo only) ─── */
const CURSOR_MOVE_SPEED = 600; // ms per cursor move
const CURSOR_CLICK_PAUSE = 300; // pause after "click"
const SPARKLE_LOADING = 900; // fake AI suggestion loading
const SUGGESTION_REVEAL_STAGGER = 80; // stagger each pill appearing
const CURSOR_TO_SUGGESTION_PAUSE = 500; // wait before moving to a suggestion
const SUGGESTION_FILL_PAUSE = 300; // pause after selecting suggestion before Generate

/*
 * Cursor-driven flow phases for Marketing demo:
 * 1. idle          → cursor not visible, fields show pre-filled (pills + number)
 * 2. cursorToSparkle → cursor appears, moves to sparkle button
 * 3. sparkleClick  → cursor clicks, sparkle loading spinner
 * 4. suggestionsIn → suggestions appear (staggered pills)
 * 5. cursorToSuggestion → cursor moves to first suggestion
 * 6. suggestionClick → cursor clicks suggestion, topic fills instantly
 * 7. cursorToGenerate → cursor moves to Generate button
 * 8. generateClick → cursor clicks, generating spinner
 * 9. output        → output cards appear
 */
type CursorPhase =
  | "idle"
  | "cursorToSparkle"
  | "sparkleClick"
  | "sparkleLoading"
  | "suggestionsIn"
  | "cursorToSuggestion"
  | "suggestionClick"
  | "cursorToGenerate"
  | "generateClick"
  | "generating"
  | "output";

/* ─── Standard (non-cursor) flow phases for Outreach & Operations ─── */
type StandardPhase = "filling" | "generating" | "output";

export function HeroDemo() {
  const [activeIndex, setActiveIndex] = useState(0);

  /* Standard flow state (outreach, operations) */
  const [phase, setPhase] = useState<StandardPhase>("filling");
  const [fillProgress, setFillProgress] = useState(0);
  const [visibleOutputs, setVisibleOutputs] = useState(0);

  /* Cursor flow state (marketing) */
  const [cursorPhase, setCursorPhase] = useState<CursorPhase>("idle");
  const [cursorPos, setCursorPos] = useState({ x: 85, y: 75 }); // % based
  const [clicking, setClicking] = useState(false);
  const [visibleSuggestions, setVisibleSuggestions] = useState(0);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [topicFilled, setTopicFilled] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const demo = demos[activeIndex];
  const theme = moduleThemes[demo.moduleKey];
  const isCursorFlow = !!demo.useCursorFlow;

  // Find the typing field for standard flow
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
    /* Reset standard */
    setPhase("filling");
    setFillProgress(0);
    setVisibleOutputs(0);
    /* Reset cursor */
    setCursorPhase("idle");
    setCursorPos({ x: 85, y: 75 });
    setClicking(false);
    setVisibleSuggestions(0);
    setSelectedSuggestion(-1);
    setTopicFilled(false);
  }, []);

  /* ─────────── CURSOR FLOW (Marketing) ─────────── */
  useEffect(() => {
    if (!isCursorFlow) return;
    if (activeIndex !== 0) return;

    let t: ReturnType<typeof setTimeout>;

    switch (cursorPhase) {
      case "idle":
        // Start: brief pause then cursor appears moving to sparkle
        t = setTimeout(() => setCursorPhase("cursorToSparkle"), 800);
        break;

      case "cursorToSparkle":
        // Move cursor to sparkle button position (top-right of topic input)
        setCursorPos({ x: 88, y: 48 });
        t = setTimeout(() => setCursorPhase("sparkleClick"), CURSOR_MOVE_SPEED);
        break;

      case "sparkleClick":
        // Show click effect
        setClicking(true);
        t = setTimeout(() => {
          setClicking(false);
          setCursorPhase("sparkleLoading");
        }, CURSOR_CLICK_PAUSE);
        break;

      case "sparkleLoading":
        // Show loading spinner on sparkle
        t = setTimeout(() => setCursorPhase("suggestionsIn"), SPARKLE_LOADING);
        break;

      case "suggestionsIn": {
        // Stagger-reveal suggestion pills
        const totalSuggestions = demo.suggestions?.length ?? 0;
        if (visibleSuggestions < totalSuggestions) {
          t = setTimeout(
            () => setVisibleSuggestions((v) => v + 1),
            SUGGESTION_REVEAL_STAGGER
          );
        } else {
          t = setTimeout(
            () => setCursorPhase("cursorToSuggestion"),
            CURSOR_TO_SUGGESTION_PAUSE
          );
        }
        break;
      }

      case "cursorToSuggestion":
        // Move cursor to first suggestion pill
        setCursorPos({ x: 42, y: 62 });
        t = setTimeout(
          () => setCursorPhase("suggestionClick"),
          CURSOR_MOVE_SPEED
        );
        break;

      case "suggestionClick":
        setClicking(true);
        setSelectedSuggestion(0);
        t = setTimeout(() => {
          setClicking(false);
          setTopicFilled(true);
          // Brief pause to show topic filled, then move to Generate
          setTimeout(
            () => setCursorPhase("cursorToGenerate"),
            SUGGESTION_FILL_PAUSE
          );
        }, CURSOR_CLICK_PAUSE);
        break;

      case "cursorToGenerate":
        // Move cursor to Generate button
        setCursorPos({ x: 50, y: 92 });
        t = setTimeout(
          () => setCursorPhase("generateClick"),
          CURSOR_MOVE_SPEED
        );
        break;

      case "generateClick":
        setClicking(true);
        t = setTimeout(() => {
          setClicking(false);
          setCursorPhase("generating");
        }, CURSOR_CLICK_PAUSE);
        break;

      case "generating":
        t = setTimeout(() => setCursorPhase("output"), GENERATING_DURATION);
        break;

      case "output":
        if (visibleOutputs < demo.outputs.length) {
          t = setTimeout(
            () => setVisibleOutputs((v) => v + 1),
            visibleOutputs === 0 ? 150 : OUTPUT_STAGGER
          );
        } else {
          t = setTimeout(advanceToNext, DISPLAY_DURATION);
        }
        break;
    }

    return () => clearTimeout(t);
  }, [
    isCursorFlow,
    activeIndex,
    cursorPhase,
    visibleSuggestions,
    visibleOutputs,
    demo.suggestions?.length,
    demo.outputs.length,
    advanceToNext,
  ]);

  /* ─────────── STANDARD FLOW (Outreach, Operations) ─────────── */
  // Filling (typing) phase
  useEffect(() => {
    if (isCursorFlow) return;
    if (phase !== "filling") return;
    if (fillProgress >= typingValue.length) {
      const t = setTimeout(() => setPhase("generating"), PAUSE_AFTER_TYPING);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setFillProgress((p) => p + 1), TYPING_SPEED);
    return () => clearTimeout(t);
  }, [isCursorFlow, phase, fillProgress, typingValue.length]);

  // Generating phase
  useEffect(() => {
    if (isCursorFlow) return;
    if (phase !== "generating") return;
    const t = setTimeout(() => setPhase("output"), GENERATING_DURATION);
    return () => clearTimeout(t);
  }, [isCursorFlow, phase]);

  // Output phase
  useEffect(() => {
    if (isCursorFlow) return;
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
  }, [isCursorFlow, phase, visibleOutputs, demo.outputs.length, advanceToNext]);

  /* ─── Derived booleans ─── */
  const showForm = isCursorFlow
    ? cursorPhase !== "output"
    : phase === "filling" || phase === "generating";

  const showOutputs = isCursorFlow
    ? cursorPhase === "output"
    : phase === "output";

  const isGenerating = isCursorFlow
    ? cursorPhase === "generating" || cursorPhase === "generateClick"
    : phase === "generating";

  const showCursor = isCursorFlow && cursorPhase !== "idle" && cursorPhase !== "output";

  const showSparkleLoading = isCursorFlow && cursorPhase === "sparkleLoading";

  const showSuggestions =
    isCursorFlow &&
    (cursorPhase === "suggestionsIn" ||
      cursorPhase === "cursorToSuggestion" ||
      cursorPhase === "suggestionClick");

  /* The topic text for marketing cursor flow */
  const cursorTopicText =
    isCursorFlow && topicFilled
      ? demo.suggestions?.[0] ?? ""
      : "";

  return (
    <div className="w-full max-w-md lg:max-w-lg">
      <GlowCard>
        <div
          className="rounded-xl overflow-hidden relative"
          style={{ backgroundColor: surface, minHeight: 380 }}
          ref={formRef}
        >
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
          <div className="p-4 sm:p-5" style={{ minHeight: 340 }}>
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
                            minHeight: 36,
                          }}
                        >
                          {/* Topic text content */}
                          {isCursorFlow ? (
                            cursorTopicText ? (
                              <span>{cursorTopicText}</span>
                            ) : (
                              <span style={{ color: textMuted }}>
                                {field.placeholder}
                              </span>
                            )
                          ) : fi === actualTypingIndex ? (
                            <>
                              {typingValue.slice(0, fillProgress)}
                              <span
                                className="inline-block w-[2px] h-[0.9em] ml-0.5 align-middle animate-cursor-blink"
                                style={{ backgroundColor: theme.accent }}
                              />
                            </>
                          ) : (
                            <span style={{ color: textMuted }}>
                              {field.placeholder}
                            </span>
                          )}

                          {/* Sparkle button */}
                          <span
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
                            style={{
                              opacity: showSparkleLoading ? 1 : 0.5,
                              backgroundColor:
                                (isCursorFlow &&
                                  (cursorPhase === "sparkleClick" ||
                                    cursorPhase === "sparkleLoading"))
                                  ? "rgba(255,255,255,0.1)"
                                  : "transparent",
                            }}
                          >
                            {showSparkleLoading ? (
                              <div
                                className="h-4 w-4 rounded-full border-2 animate-spin"
                                style={{
                                  borderColor: `${theme.accent}40`,
                                  borderTopColor: theme.accent,
                                }}
                              />
                            ) : (
                              <SparkleIcon color={theme.accent} />
                            )}
                          </span>
                        </div>

                        {/* Suggestions row (cursor flow only) */}
                        {showSuggestions && demo.suggestions && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {demo.suggestions.map((s, si) => (
                              <span
                                key={si}
                                className="px-2.5 py-1 text-[10px] rounded-full border transition-all"
                                style={{
                                  borderColor:
                                    selectedSuggestion === si
                                      ? theme.accent
                                      : border,
                                  backgroundColor:
                                    selectedSuggestion === si
                                      ? `${theme.accent}15`
                                      : "transparent",
                                  color:
                                    selectedSuggestion === si
                                      ? theme.accent
                                      : textPrimary,
                                  opacity: si < visibleSuggestions ? 1 : 0,
                                  transform:
                                    si < visibleSuggestions
                                      ? "translateY(0)"
                                      : "translateY(4px)",
                                  transition: "all 0.2s ease-out",
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between mt-1">
                          <span className="text-[10px]" style={{ color: textMuted }}>
                            Output language follows your input language
                          </span>
                          <span
                            className="text-[10px] tabular-nums"
                            style={{ color: textMuted }}
                          >
                            {isCursorFlow
                              ? cursorTopicText.length
                              : fi === actualTypingIndex
                                ? fillProgress
                                : 0}
                            /200
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
                        {!isCursorFlow && fi === actualTypingIndex ? (
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
                  {!isGenerating && (
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
                      opacity: isGenerating ? 0.6 : 1,
                    }}
                  >
                    {isGenerating ? (
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
            ) : showOutputs ? (
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
                      className="rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: surface,
                        border: `1px solid ${border}`,
                        opacity: i < visibleOutputs ? 1 : 0,
                        transform:
                          i < visibleOutputs
                            ? "translateY(0)"
                            : "translateY(8px)",
                        transition: "all 0.4s ease-out",
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
            ) : null}
          </div>

          {/* ── Animated cursor overlay ── */}
          {showCursor && (
            <div
              className="absolute pointer-events-none z-50"
              style={{
                left: `${cursorPos.x}%`,
                top: `${cursorPos.y}%`,
                transition: `left ${CURSOR_MOVE_SPEED}ms cubic-bezier(0.4, 0, 0.2, 1), top ${CURSOR_MOVE_SPEED}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                transform: clicking ? "scale(0.85)" : "scale(1)",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              }}
            >
              <CursorIcon size={20} />
              {/* Click ripple */}
              {clicking && (
                <div
                  className="absolute -top-1 -left-1 w-6 h-6 rounded-full animate-ping"
                  style={{
                    backgroundColor: `${theme.accent}30`,
                    animationDuration: "0.4s",
                    animationIterationCount: 1,
                  }}
                />
              )}
            </div>
          )}
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
