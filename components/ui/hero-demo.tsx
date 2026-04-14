"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Design tokens (exact match with app) ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const border = "rgba(255,255,255,0.06)";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";

/* ─── FIXED CARD DIMENSIONS — never changes across phases or modules ─── */
const CARD_WIDTH = 480; // px, desktop; mobile uses 100%
const CONTENT_HEIGHT = 380; // px, inner content area below top bar

/* ─── Module colors (exact match with app sidebar) ─── */
const moduleThemes = {
  marketing: { accent: "#6c8cff", light: "#818cf8", label: "Marketing OS" },
  outreach: { accent: "#22c55e", light: "#34d399", label: "Outreach OS" },
  operations: { accent: "#f97316", light: "#fb923c", label: "Operations OS" },
};

/* ─── Sparkle icon ─── */
function SparkleIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
    </svg>
  );
}

/* ─── Cursor SVG ─── */
function CursorIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5.65 1.15 21.05 12.9h-8.35l4.5 8.5-3.2 1.6-4.3-8.75L5.65 18.3V1.15Z" fill="#fff" stroke="#000" strokeWidth={1} strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Demo scenarios ─── */
interface DemoScenario {
  moduleKey: "marketing" | "outreach" | "operations";
  workflow: string;
  useCursorFlow?: boolean;
  fields: Array<
    | { type: "pills"; label: string; options: string[]; selected: number }
    | { type: "topic"; label: string; value: string; placeholder: string }
    | { type: "text"; label: string; value: string; placeholder: string }
    | { type: "number"; label: string; options: string[]; selected: number }
  >;
  suggestions?: string[];
  outputs: Array<{ label: string; text: string }>;
}

/*
 * ALL output texts are trimmed to fit within CONTENT_HEIGHT.
 * Each module's form + output must render within the same fixed box.
 */
const demos: DemoScenario[] = [
  {
    moduleKey: "marketing",
    workflow: "Social Posts",
    useCursorFlow: true,
    fields: [
      { type: "pills", label: "Platform", options: ["Instagram", "LinkedIn", "Facebook"], selected: 1 },
      { type: "topic", label: "Topic", value: "Launch announcement for our new brand strategy service", placeholder: "e.g. Why small businesses need a content strategy" },
      { type: "number", label: "Number of posts", options: ["1", "2", "3"], selected: 1 },
    ],
    suggestions: [
      "Launch announcement for our new brand strategy service",
      "How to stand out in a crowded market",
      "5 signs your brand needs a refresh",
    ],
    outputs: [
      {
        label: "Post 1",
        text: "We just launched something we\u2019ve been building for months. Brand strategy for service businesses who want clarity, not templates.",
      },
      {
        label: "Post 2",
        text: "Most solo founders skip brand strategy because it sounds expensive. We made it practical: clear positioning, real messaging, and a plan you can execute on.",
      },
    ],
  },
  {
    moduleKey: "outreach",
    workflow: "Cold Email",
    fields: [
      { type: "text", label: "Prospect name", value: "Sarah Chen", placeholder: "e.g. Sarah Chen" },
      { type: "text", label: "Role", value: "VP of Marketing", placeholder: "e.g. VP of Marketing" },
      { type: "text", label: "Company", value: "Bloom Studio", placeholder: "e.g. Acme Corp" },
      { type: "pills", label: "Goal", options: ["Book a call", "Get a reply", "Share a resource"], selected: 0 },
    ],
    outputs: [
      {
        label: "Subject",
        text: "Quick question about Bloom\u2019s content pipeline",
      },
      {
        label: "Email",
        text: "Hi Sarah,\n\nI noticed Bloom Studio shifted toward video-first content \u2014 smart move for the agency space.\n\nWe help marketing teams turn one brief into a full cross-platform campaign. Worth a quick 15-min call?\n\nHappy to share how it works.",
      },
    ],
  },
  {
    moduleKey: "operations",
    workflow: "Client Onboarding",
    fields: [
      { type: "text", label: "Client name", value: "Meridian Consulting", placeholder: "e.g. Bloom Skincare" },
      { type: "text", label: "Service type", value: "Brand identity", placeholder: "e.g. Brand identity" },
      { type: "text", label: "Start date", value: "May 1, 2026", placeholder: "e.g. May 1, 2025" },
    ],
    outputs: [
      {
        label: "Timeline",
        text: "Week 1\u20132: Discovery & brand audit\nWeek 3\u20134: Strategy & concept development\nWeek 5: Refinement & revisions\nWeek 6: Final delivery & handoff",
      },
      {
        label: "Next steps",
        text: "1. Schedule kickoff call (before May 1)\n2. Share existing brand assets\n3. Complete brand intake questionnaire\n4. Confirm milestone review dates",
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

/* ─── Cursor flow timing ─── */
const CURSOR_MOVE_SPEED = 600;
const CURSOR_CLICK_PAUSE = 300;
const SPARKLE_LOADING = 900;
const SUGGESTION_REVEAL_STAGGER = 80;
const CURSOR_TO_SUGGESTION_PAUSE = 500;
const SUGGESTION_FILL_PAUSE = 300;

type CursorPhase =
  | "idle" | "cursorToSparkle" | "sparkleClick" | "sparkleLoading"
  | "suggestionsIn" | "cursorToSuggestion" | "suggestionClick"
  | "cursorToGenerate" | "generateClick" | "generating" | "output";

type StandardPhase = "filling" | "generating" | "output";

export function HeroDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<StandardPhase>("filling");
  const [fillProgress, setFillProgress] = useState(0);
  const [visibleOutputs, setVisibleOutputs] = useState(0);
  const [cursorPhase, setCursorPhase] = useState<CursorPhase>("idle");
  const [clicking, setClicking] = useState(false);
  const [visibleSuggestions, setVisibleSuggestions] = useState(0);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [topicFilled, setTopicFilled] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const sparkleRef = useRef<HTMLSpanElement>(null);
  const firstSuggestionRef = useRef<HTMLSpanElement>(null);
  const generateRef = useRef<HTMLDivElement>(null);
  const [cursorXY, setCursorXY] = useState<{ left: number; top: number }>({ left: -40, top: -40 });

  const demo = demos[activeIndex];
  const theme = moduleThemes[demo.moduleKey];
  const isCursorFlow = !!demo.useCursorFlow;

  const typingFieldIndex = demo.fields.findIndex((f) => f.type === "topic");
  const actualTypingIndex = typingFieldIndex >= 0
    ? typingFieldIndex
    : demo.fields.reduce((last, f, i) => (f.type === "text" ? i : last), 0);
  const typingField = demo.fields[actualTypingIndex];
  const typingValue = "value" in typingField ? typingField.value : "";

  const moveCursorTo = useCallback(
    (targetRef: React.RefObject<HTMLElement | null>) => {
      if (!cardRef.current || !targetRef.current) return;
      const card = cardRef.current.getBoundingClientRect();
      const el = targetRef.current.getBoundingClientRect();
      setCursorXY({
        left: el.left - card.left + el.width / 2,
        top: el.top - card.top + el.height / 2,
      });
    }, []
  );

  const advanceToNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % demos.length);
    setPhase("filling");
    setFillProgress(0);
    setVisibleOutputs(0);
    setCursorPhase("idle");
    setCursorXY({ left: -40, top: -40 });
    setClicking(false);
    setVisibleSuggestions(0);
    setSelectedSuggestion(-1);
    setTopicFilled(false);
  }, []);

  /* ─── CURSOR FLOW (Marketing) ─── */
  useEffect(() => {
    if (!isCursorFlow || activeIndex !== 0) return;
    let t: ReturnType<typeof setTimeout>;
    switch (cursorPhase) {
      case "idle":
        t = setTimeout(() => setCursorPhase("cursorToSparkle"), 800);
        break;
      case "cursorToSparkle":
        moveCursorTo(sparkleRef);
        t = setTimeout(() => setCursorPhase("sparkleClick"), CURSOR_MOVE_SPEED);
        break;
      case "sparkleClick":
        setClicking(true);
        t = setTimeout(() => { setClicking(false); setCursorPhase("sparkleLoading"); }, CURSOR_CLICK_PAUSE);
        break;
      case "sparkleLoading":
        t = setTimeout(() => setCursorPhase("suggestionsIn"), SPARKLE_LOADING);
        break;
      case "suggestionsIn": {
        const total = demo.suggestions?.length ?? 0;
        if (visibleSuggestions < total) {
          t = setTimeout(() => setVisibleSuggestions((v) => v + 1), SUGGESTION_REVEAL_STAGGER);
        } else {
          t = setTimeout(() => setCursorPhase("cursorToSuggestion"), CURSOR_TO_SUGGESTION_PAUSE);
        }
        break;
      }
      case "cursorToSuggestion":
        requestAnimationFrame(() => moveCursorTo(firstSuggestionRef));
        t = setTimeout(() => setCursorPhase("suggestionClick"), CURSOR_MOVE_SPEED);
        break;
      case "suggestionClick":
        setClicking(true);
        setSelectedSuggestion(0);
        t = setTimeout(() => {
          setClicking(false);
          setTopicFilled(true);
          setTimeout(() => setCursorPhase("cursorToGenerate"), SUGGESTION_FILL_PAUSE);
        }, CURSOR_CLICK_PAUSE);
        break;
      case "cursorToGenerate":
        moveCursorTo(generateRef);
        t = setTimeout(() => setCursorPhase("generateClick"), CURSOR_MOVE_SPEED);
        break;
      case "generateClick":
        setClicking(true);
        t = setTimeout(() => { setClicking(false); setCursorPhase("generating"); }, CURSOR_CLICK_PAUSE);
        break;
      case "generating":
        t = setTimeout(() => setCursorPhase("output"), GENERATING_DURATION);
        break;
      case "output":
        if (visibleOutputs < demo.outputs.length) {
          t = setTimeout(() => setVisibleOutputs((v) => v + 1), visibleOutputs === 0 ? 150 : OUTPUT_STAGGER);
        } else {
          t = setTimeout(advanceToNext, DISPLAY_DURATION);
        }
        break;
    }
    return () => clearTimeout(t);
  }, [isCursorFlow, activeIndex, cursorPhase, visibleSuggestions, visibleOutputs, demo.suggestions?.length, demo.outputs.length, advanceToNext, moveCursorTo]);

  /* ─── STANDARD FLOW (Outreach, Operations) ─── */
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

  useEffect(() => {
    if (isCursorFlow || phase !== "generating") return;
    const t = setTimeout(() => setPhase("output"), GENERATING_DURATION);
    return () => clearTimeout(t);
  }, [isCursorFlow, phase]);

  useEffect(() => {
    if (isCursorFlow || phase !== "output") return;
    if (visibleOutputs < demo.outputs.length) {
      const t = setTimeout(() => setVisibleOutputs((v) => v + 1), visibleOutputs === 0 ? 150 : OUTPUT_STAGGER);
      return () => clearTimeout(t);
    }
    const t = setTimeout(advanceToNext, DISPLAY_DURATION);
    return () => clearTimeout(t);
  }, [isCursorFlow, phase, visibleOutputs, demo.outputs.length, advanceToNext]);

  /* ─── Derived state ─── */
  const showForm = isCursorFlow ? cursorPhase !== "output" : phase === "filling" || phase === "generating";
  const showOutputs = isCursorFlow ? cursorPhase === "output" : phase === "output";
  const isGenerating = isCursorFlow ? cursorPhase === "generating" || cursorPhase === "generateClick" : phase === "generating";
  const showCursor = isCursorFlow && cursorPhase !== "idle" && cursorPhase !== "output";
  const showSparkleLoading = isCursorFlow && cursorPhase === "sparkleLoading";
  const showSuggestions = isCursorFlow && ["suggestionsIn", "cursorToSuggestion", "suggestionClick"].includes(cursorPhase);
  const cursorTopicText = isCursorFlow && topicFilled ? (demo.suggestions?.[0] ?? "") : "";

  return (
    /* Outer wrapper: fixed width on desktop, fluid on mobile */
    <div style={{ width: CARD_WIDTH, maxWidth: "100%" }}>
      <div
        ref={cardRef}
        className="rounded-xl overflow-hidden relative"
        style={{
          width: "100%",
          backgroundColor: surface,
          border: `1px solid ${border}`,
          boxShadow: "0 0 40px -10px rgba(108,140,255,0.15), 0 1rem 2rem -1rem rgba(0,0,0,0.5)",
        }}
      >
        {/* ── Top bar ── */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/10" />
            <span className="w-2 h-2 rounded-full bg-white/10" />
            <span className="w-2 h-2 rounded-full bg-white/10" />
          </div>
          <img src="/logo.png" alt="" className="h-4 w-4 object-contain ml-1.5" />
          <span className="text-[11px] font-medium" style={{ color: theme.accent }}>{theme.label}</span>
          <span className="text-[11px]" style={{ color: textMuted }}>/ {demo.workflow}</span>
        </div>

        {/* ── Accent gradient bar ── */}
        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.light})` }} />

        {/* ── Content area — FIXED height, overflow hidden ── */}
        <div className="p-4 sm:p-5 overflow-hidden" style={{ height: CONTENT_HEIGHT }}>
          {showForm ? (
            <div className="space-y-3">
              {demo.fields.map((field, fi) => (
                <div key={`${activeIndex}-${fi}`}>
                  <p className="text-[12px] font-medium mb-1.5" style={{ color: textPrimary }}>{field.label}</p>

                  {field.type === "pills" && (
                    <div className="flex flex-wrap gap-1.5">
                      {field.options.map((opt, oi) => (
                        <span key={opt} className="px-3 py-1.5 text-[11px] rounded-lg border" style={{
                          backgroundColor: oi === field.selected ? `${theme.accent}18` : "transparent",
                          borderColor: oi === field.selected ? theme.accent : border,
                          color: oi === field.selected ? theme.accent : textMuted,
                        }}>{opt}</span>
                      ))}
                    </div>
                  )}

                  {field.type === "number" && (
                    <div className="flex gap-1.5">
                      {field.options.map((opt, oi) => (
                        <span key={opt} className="w-9 h-8 flex items-center justify-center text-[12px] rounded-lg border" style={{
                          backgroundColor: oi === field.selected ? `${theme.accent}18` : "transparent",
                          borderColor: oi === field.selected ? theme.accent : border,
                          color: oi === field.selected ? theme.accent : textMuted,
                        }}>{opt}</span>
                      ))}
                    </div>
                  )}

                  {field.type === "topic" && (
                    <div>
                      <div className="relative rounded-lg px-3 py-2 text-[12px] leading-relaxed" style={{ backgroundColor: bg, border: `1px solid ${border}`, color: textPrimary, minHeight: 36 }}>
                        {isCursorFlow ? (
                          cursorTopicText
                            ? <span>{cursorTopicText}</span>
                            : <span style={{ color: textMuted }}>{field.placeholder}</span>
                        ) : fi === actualTypingIndex ? (
                          <>
                            {typingValue.slice(0, fillProgress)}
                            <span className="inline-block w-[2px] h-[0.9em] ml-0.5 align-middle animate-cursor-blink" style={{ backgroundColor: theme.accent }} />
                          </>
                        ) : (
                          <span style={{ color: textMuted }}>{field.placeholder}</span>
                        )}
                        <span ref={isCursorFlow ? sparkleRef : undefined} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors" style={{
                          opacity: showSparkleLoading ? 1 : 0.5,
                          backgroundColor: isCursorFlow && (cursorPhase === "sparkleClick" || cursorPhase === "sparkleLoading") ? "rgba(255,255,255,0.1)" : "transparent",
                        }}>
                          {showSparkleLoading ? (
                            <div className="h-4 w-4 rounded-full border-2 animate-spin" style={{ borderColor: `${theme.accent}40`, borderTopColor: theme.accent }} />
                          ) : (
                            <SparkleIcon color={theme.accent} />
                          )}
                        </span>
                      </div>

                      {/* Suggestions — animated maxHeight to avoid layout shift */}
                      {isCursorFlow && (
                        <div className="flex flex-wrap gap-1.5 overflow-hidden transition-all duration-300" style={{
                          maxHeight: showSuggestions ? 60 : 0,
                          opacity: showSuggestions ? 1 : 0,
                          marginTop: showSuggestions ? 8 : 0,
                        }}>
                          {demo.suggestions?.map((s, si) => (
                            <span key={si} ref={si === 0 ? firstSuggestionRef : undefined} className="px-2.5 py-1 text-[10px] rounded-full border transition-all" style={{
                              borderColor: selectedSuggestion === si ? theme.accent : border,
                              backgroundColor: selectedSuggestion === si ? `${theme.accent}15` : "transparent",
                              color: selectedSuggestion === si ? theme.accent : textPrimary,
                              opacity: si < visibleSuggestions ? 1 : 0,
                              transform: si < visibleSuggestions ? "translateY(0)" : "translateY(4px)",
                              transition: "all 0.2s ease-out",
                            }}>{s}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between mt-1">
                        <span className="text-[10px]" style={{ color: textMuted }}>Output language follows your input language</span>
                        <span className="text-[10px] tabular-nums" style={{ color: textMuted }}>
                          {isCursorFlow ? cursorTopicText.length : fi === actualTypingIndex ? fillProgress : 0}/200
                        </span>
                      </div>
                    </div>
                  )}

                  {field.type === "text" && (
                    <div className="rounded-lg px-3 py-2 text-[12px] leading-relaxed min-h-[34px]" style={{ backgroundColor: bg, border: `1px solid ${border}`, color: textPrimary }}>
                      {!isCursorFlow && fi === actualTypingIndex ? (
                        <>
                          {typingValue.slice(0, fillProgress)}
                          <span className="inline-block w-[2px] h-[0.9em] ml-0.5 align-middle animate-cursor-blink" style={{ backgroundColor: theme.accent }} />
                        </>
                      ) : (
                        <span style={{ color: textPrimary }}>{field.value}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Generate button */}
              <div className="relative group mt-1" ref={isCursorFlow ? generateRef : undefined}>
                {!isGenerating && (
                  <div className="absolute -inset-1 rounded-2xl blur-xl opacity-40" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.light})` }} />
                )}
                <div className="relative w-full py-2.5 text-[13px] font-semibold rounded-xl text-center text-white flex items-center justify-center gap-2" style={{
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.light})`,
                  opacity: isGenerating ? 0.6 : 1,
                }}>
                  {isGenerating ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                      Generating...
                    </>
                  ) : "Generate"}
                </div>
              </div>
            </div>
          ) : showOutputs ? (
            <div>
              <div className="flex justify-between items-center px-0.5 mb-3">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: textMuted }}>Output</span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: textMuted }}>Copy</span>
              </div>
              <div className="space-y-2.5">
                {demo.outputs.map((output, i) => (
                  <div key={`${activeIndex}-out-${i}`} className="rounded-xl overflow-hidden" style={{
                    backgroundColor: surface,
                    border: `1px solid ${border}`,
                    opacity: i < visibleOutputs ? 1 : 0,
                    transform: i < visibleOutputs ? "translateY(0)" : "translateY(8px)",
                    transition: "all 0.4s ease-out",
                  }}>
                    <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.light})` }} />
                    <div className="px-3.5 py-2.5">
                      <p className="text-[9px] font-medium uppercase tracking-wider mb-1" style={{ color: theme.accent }}>{output.label}</p>
                      <p className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: textPrimary }}>{output.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Animated cursor overlay ── */}
        {showCursor && (
          <div className="absolute pointer-events-none z-50" style={{
            left: cursorXY.left,
            top: cursorXY.top,
            transition: `left ${CURSOR_MOVE_SPEED}ms cubic-bezier(0.4, 0, 0.2, 1), top ${CURSOR_MOVE_SPEED}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            transform: clicking ? "scale(0.85)" : "scale(1)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
          }}>
            <CursorIcon size={20} />
            {clicking && (
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full animate-ping" style={{
                backgroundColor: `${theme.accent}30`,
                animationDuration: "0.4s",
                animationIterationCount: 1,
              }} />
            )}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {demos.map((d, i) => (
          <span key={d.moduleKey} className="w-2 h-2 rounded-full transition-all duration-300" style={{
            backgroundColor: i === activeIndex ? moduleThemes[d.moduleKey].accent : "rgba(255,255,255,0.15)",
            transform: i === activeIndex ? "scale(1.3)" : "scale(1)",
          }} />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-cursor-blink { animation: cursor-blink 0.8s step-end infinite; }
      `}} />
    </div>
  );
}
