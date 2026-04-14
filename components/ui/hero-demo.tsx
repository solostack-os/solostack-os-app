"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Design tokens (match app) ─── */
const surface = "#111827";
const inputBg = "#0d1526";
const border = "rgba(255,255,255,0.06)";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";

/* ─── Module accent colors (consistent with app sidebar) ─── */
const moduleColors = {
  marketing: "#6c8cff",
  outreach: "#5eead4",
  operations: "#f59e0b",
};

/* ─── Demo scenarios ─── */
const demos = [
  {
    module: "Marketing OS",
    moduleKey: "marketing" as const,
    workflow: "Social Posts",
    inputLabel: "Topic",
    inputText: "Launch announcement for our new brand strategy service",
    outputs: [
      {
        label: "LinkedIn",
        text: "We just launched something we\u2019ve been building for months. If you\u2019re a service business tired of guessing your next move\u2014this is for you.",
      },
      {
        label: "Instagram",
        text: "New service alert \ud83d\udea8 Brand strategy packages designed for solo founders who want clarity, not fluff. Link in bio.",
      },
    ],
  },
  {
    module: "Outreach OS",
    moduleKey: "outreach" as const,
    workflow: "Cold Email",
    inputLabel: "Prospect",
    inputText: "Sarah Chen, Head of Marketing at Bloom Studio",
    outputs: [
      {
        label: "Subject",
        text: "Quick question about Bloom\u2019s content pipeline",
      },
      {
        label: "Body",
        text: "Hi Sarah, I noticed Bloom Studio shifted toward video-first content this quarter. We help agencies like yours turn one content brief into a full cross-platform campaign. Worth a 15-min call?",
      },
    ],
  },
  {
    module: "Operations OS",
    moduleKey: "operations" as const,
    workflow: "Client Onboarding",
    inputLabel: "Client",
    inputText: "Meridian Consulting \u2014 Brand identity project, 6 weeks",
    outputs: [
      {
        label: "Timeline",
        text: "Week 1\u20132: Discovery & research \u2022 Week 3\u20134: Strategy & concepts \u2022 Week 5\u20136: Refinement & delivery",
      },
      {
        label: "Next steps",
        text: "1. Schedule kickoff call \u2022 2. Share brand assets folder \u2022 3. Complete intake questionnaire \u2022 4. Confirm milestone dates",
      },
    ],
  },
];

const TYPING_SPEED = 35;
const PAUSE_AFTER_TYPING = 600;
const GENERATING_DURATION = 1200;
const OUTPUT_STAGGER = 250;
const DISPLAY_DURATION = 4000;

export function HeroDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "generating" | "output">("typing");
  const [visibleOutputs, setVisibleOutputs] = useState(0);

  const demo = demos[activeIndex];
  const color = moduleColors[demo.moduleKey];

  const advanceToNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % demos.length);
    setTyped("");
    setPhase("typing");
    setVisibleOutputs(0);
  }, []);

  // Typing phase
  useEffect(() => {
    if (phase !== "typing") return;
    if (typed.length >= demo.inputText.length) {
      const t = setTimeout(() => setPhase("generating"), PAUSE_AFTER_TYPING);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setTyped(demo.inputText.slice(0, typed.length + 1));
    }, TYPING_SPEED);
    return () => clearTimeout(t);
  }, [phase, typed, demo.inputText]);

  // Generating phase
  useEffect(() => {
    if (phase !== "generating") return;
    const t = setTimeout(() => setPhase("output"), GENERATING_DURATION);
    return () => clearTimeout(t);
  }, [phase]);

  // Output phase — stagger outputs then hold
  useEffect(() => {
    if (phase !== "output") return;
    if (visibleOutputs < demo.outputs.length) {
      const t = setTimeout(
        () => setVisibleOutputs((v) => v + 1),
        visibleOutputs === 0 ? 100 : OUTPUT_STAGGER
      );
      return () => clearTimeout(t);
    }
    // All outputs visible — hold then advance
    const t = setTimeout(advanceToNext, DISPLAY_DURATION);
    return () => clearTimeout(t);
  }, [phase, visibleOutputs, demo.outputs.length, advanceToNext]);

  return (
    <div className="w-full max-w-md lg:max-w-lg">
      {/* Demo card */}
      <div
        className="rounded-xl overflow-hidden shadow-2xl shadow-black/40"
        style={{ backgroundColor: surface }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/10" />
              <span className="w-2 h-2 rounded-full bg-white/10" />
              <span className="w-2 h-2 rounded-full bg-white/10" />
            </div>
            <span className="text-[11px] font-medium ml-1" style={{ color }}>
              {demo.module}
            </span>
            <span className="text-[11px]" style={{ color: textMuted }}>
              / {demo.workflow}
            </span>
          </div>
        </div>

        <div className="p-4">
          {/* Input area */}
          <div className="mb-3">
            <p
              className="text-[10px] uppercase tracking-widest mb-1.5 font-medium"
              style={{ color: textMuted }}
            >
              {demo.inputLabel}
            </p>
            <div
              className="rounded-lg px-3 py-2.5 text-[13px] leading-relaxed min-h-[42px]"
              style={{
                backgroundColor: inputBg,
                border: `1px solid ${border}`,
                color: textPrimary,
              }}
            >
              {typed}
              {phase === "typing" && (
                <span
                  className="inline-block w-[2px] h-[0.9em] ml-0.5 align-middle animate-cursor-blink"
                  style={{ backgroundColor: color }}
                />
              )}
            </div>
          </div>

          {/* Generate button */}
          <button
            className="w-full rounded-lg py-2 text-[12px] font-medium mb-3 transition-opacity"
            style={{
              backgroundColor: phase === "generating" ? `${color}33` : color,
              color: phase === "generating" ? color : "#0a0f1e",
              opacity: phase === "typing" ? 0.5 : 1,
            }}
            tabIndex={-1}
          >
            {phase === "generating" ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="w-3 h-3 rounded-full animate-demo-pulse"
                  style={{ backgroundColor: color }}
                />
                Generating...
              </span>
            ) : (
              "Generate"
            )}
          </button>

          {/* Output area */}
          <div className="space-y-2 min-h-[120px]">
            {demo.outputs.map((output, i) => (
              <div
                key={`${activeIndex}-${output.label}`}
                className="rounded-lg px-3 py-2.5 transition-all duration-300"
                style={{
                  backgroundColor: inputBg,
                  borderLeft: `3px solid ${color}`,
                  opacity: phase === "output" && i < visibleOutputs ? 1 : 0,
                  transform:
                    phase === "output" && i < visibleOutputs
                      ? "translateY(0)"
                      : "translateY(6px)",
                }}
              >
                <p
                  className="text-[9px] uppercase tracking-widest mb-1 font-medium"
                  style={{ color }}
                >
                  {output.label}
                </p>
                <p
                  className="text-[12px] leading-relaxed"
                  style={{ color: textPrimary }}
                >
                  {output.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {demos.map((d, i) => (
          <span
            key={d.moduleKey}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                i === activeIndex ? moduleColors[d.moduleKey] : "rgba(255,255,255,0.15)",
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
          @keyframes demo-pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          .animate-demo-pulse {
            animation: demo-pulse 1s ease-in-out infinite;
          }
        `,
        }}
      />
    </div>
  );
}
