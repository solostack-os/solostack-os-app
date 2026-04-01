"use client";

import { useState, useEffect, useCallback } from "react";
import { GlowCard } from "@/components/ui/glow-card";

const INPUT_TEXT =
  "Facebook Ad for my consulting service — target: freelancers and solopreneurs";
const TYPING_SPEED = 40;
const PAUSE_AFTER_TYPING = 800;
const GENERATING_DURATION = 1500;
const STAGGER_DELAY = 300;
const LOOP_WAIT = 5000;

const variants = [
  {
    label: "Variant 1",
    borderColor: "#6c8cff",
    text: "Spending 3 hours a day on marketing? Us neither. That\u2019s why we built SoloStack. One input, one ready-to-use output. Try free for 7 days.",
  },
  {
    label: "Variant 2",
    borderColor: "#5eead4",
    text: "Stop writing the same brief 10 times. SoloStack remembers your business and delivers content, outreach, and SOPs in seconds. Start free.",
  },
  {
    label: "Variant 3",
    borderColor: "#a78bfa",
    text: "Freelancer with 12 tabs open and zero content posted? SoloStack: an AI workspace that actually knows what you sell. Try free.",
  },
];

export function WorkflowDemo() {
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "generating" | "output">("typing");
  const [visibleVariants, setVisibleVariants] = useState(0);

  const reset = useCallback(() => {
    setTyped("");
    setPhase("typing");
    setVisibleVariants(0);
  }, []);

  // Typing phase
  useEffect(() => {
    if (phase !== "typing") return;
    if (typed.length >= INPUT_TEXT.length) {
      const t = setTimeout(() => setPhase("generating"), PAUSE_AFTER_TYPING);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setTyped(INPUT_TEXT.slice(0, typed.length + 1));
    }, TYPING_SPEED);
    return () => clearTimeout(t);
  }, [phase, typed]);

  // Generating phase
  useEffect(() => {
    if (phase !== "generating") return;
    const t = setTimeout(() => setPhase("output"), GENERATING_DURATION);
    return () => clearTimeout(t);
  }, [phase]);

  // Output phase — stagger variants
  useEffect(() => {
    if (phase !== "output") return;
    if (visibleVariants >= variants.length) {
      const t = setTimeout(reset, LOOP_WAIT);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setVisibleVariants((v) => v + 1);
    }, visibleVariants === 0 ? 100 : STAGGER_DELAY);
    return () => clearTimeout(t);
  }, [phase, visibleVariants, reset]);

  return (
    <div className="max-w-2xl mx-auto">
      <GlowCard>
        <div
          className="rounded-xl overflow-hidden min-h-[520px]"
          style={{
            backgroundColor: "#111827",
          }}
        >
          {/* Top bar */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <div className="flex items-center gap-2 ml-2">
              <img src="/logo.png" alt="" className="h-5 w-5 object-contain" />
              <span className="text-[11px] text-white">SoloStack OS</span>
              <span className="text-[11px] text-slate-400">&mdash; Marketing Module</span>
            </div>
          </div>

          <div className="p-5">
            {/* Input area */}
            <div>
              <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>
                What do you need?
              </p>
              <div
                className="rounded-lg px-4 py-3 min-h-[52px] text-sm leading-relaxed"
                style={{
                  backgroundColor: "#0d1526",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#f1f5f9",
                }}
              >
                {typed}
                {phase === "typing" && (
                  <span
                    className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
                    style={{
                      backgroundColor: "#6c8cff",
                      animation: "cursorBlink 0.8s step-end infinite",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Generating indicator — positioned in variants area */}
            <div className="mt-4">
              {phase === "generating" && (
                <div className="flex items-center gap-2 py-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: "#6c8cff",
                      animation: "pulse 1s ease-in-out infinite",
                    }}
                  />
                  <span className="text-sm" style={{ color: "#94a3b8" }}>
                    Generating...
                  </span>
                </div>
              )}

              {/* Output variants — always rendered, visibility controlled by opacity */}
              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div
                    key={v.label}
                    className="rounded-lg px-4 py-3"
                    style={{
                      backgroundColor: "#0d1526",
                      borderLeft: `3px solid ${v.borderColor}`,
                      opacity: phase === "output" && i < visibleVariants ? 1 : 0,
                      transform: phase === "output" && i < visibleVariants ? "translateY(0)" : "translateY(8px)",
                      transition: "opacity 0.4s ease, transform 0.4s ease",
                    }}
                  >
                    <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: v.borderColor }}>
                      {v.label}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#f1f5f9" }}>
                      {v.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </GlowCard>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes cursorBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.15); }
          }
        `,
      }} />
    </div>
  );
}
