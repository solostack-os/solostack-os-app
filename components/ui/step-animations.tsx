"use client";

import { useState, useEffect } from "react";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const border = "rgba(255,255,255,0.06)";
const accent = "#6c8cff";
const accentTeal = "#5eead4";
const accentOrange = "#f59e0b";
const textMuted = "#94a3b8";
const textPrimary = "#f1f5f9";

/* ════════════════════════════════════════════════════════════
   STEP 1 — Context form filling in
   ════════════════════════════════════════════════════════════ */
const contextFields = [
  { label: "Company", value: "Bloom Studio" },
  { label: "Industry", value: "Design agency" },
  { label: "Audience", value: "Startup founders" },
  { label: "Tone", value: "Professional, warm" },
];

export function StepOneAnimation() {
  const [filledCount, setFilledCount] = useState(0);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setFilledCount(0);
      setShowCheck(false);

      contextFields.forEach((_, i) => {
        setTimeout(() => setFilledCount(i + 1), (i + 1) * 600);
      });

      setTimeout(() => setShowCheck(true), (contextFields.length + 1) * 600);
      setTimeout(cycle, (contextFields.length + 2) * 600 + 2000);
    };

    cycle();
    return () => {}; // cleanup handled by unmount
  }, []);

  return (
    <div
      className="rounded-lg overflow-hidden mt-4"
      style={{ backgroundColor: surface, border: `1px solid ${border}` }}
    >
      {/* Mini top bar */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5"
        style={{ borderBottom: `1px solid ${border}` }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="text-[9px] ml-1" style={{ color: textMuted }}>
          Business Context
        </span>
      </div>

      <div className="p-3 space-y-2">
        {contextFields.map((field, i) => (
          <div key={field.label} className="flex items-center gap-2">
            <span
              className="text-[9px] w-14 flex-shrink-0"
              style={{ color: textMuted }}
            >
              {field.label}
            </span>
            <div
              className="flex-1 rounded px-2 py-1 text-[9px] transition-all duration-400"
              style={{
                backgroundColor: bg,
                border: `1px solid ${i < filledCount ? `${accent}40` : border}`,
                color: i < filledCount ? textPrimary : "transparent",
                minHeight: 22,
              }}
            >
              {i < filledCount ? field.value : "\u00A0"}
            </div>
            {i < filledCount && (
              <span
                className="text-[10px] transition-opacity duration-300"
                style={{ color: accentTeal, opacity: 1 }}
              >
                &#10003;
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Save bar */}
      <div
        className="px-3 py-2 flex justify-end transition-opacity duration-500"
        style={{
          borderTop: `1px solid ${border}`,
          opacity: showCheck ? 1 : 0.3,
        }}
      >
        <span
          className="text-[9px] font-medium px-3 py-1 rounded transition-all duration-300"
          style={{
            backgroundColor: showCheck ? accent : "transparent",
            color: showCheck ? bg : textMuted,
            border: showCheck ? "none" : `1px solid ${border}`,
          }}
        >
          {showCheck ? "Saved ✓" : "Save"}
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   STEP 2 — Module selector cycling
   ════════════════════════════════════════════════════════════ */
const moduleOptions = [
  { label: "Marketing OS", color: accent, icon: "✦" },
  { label: "Outreach OS", color: accentTeal, icon: "▸" },
  { label: "Operations OS", color: accentOrange, icon: "▤" },
];

export function StepTwoAnimation() {
  const [activeModule, setActiveModule] = useState(-1);
  const [selectedWorkflow, setSelectedWorkflow] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setActiveModule(-1);
      setSelectedWorkflow(false);

      setTimeout(() => setActiveModule(0), 500);
      setTimeout(() => setActiveModule(1), 1200);
      setTimeout(() => setActiveModule(0), 1900);
      setTimeout(() => setSelectedWorkflow(true), 2400);
      setTimeout(cycle, 5000);
    };

    cycle();
    return () => {};
  }, []);

  return (
    <div
      className="rounded-lg overflow-hidden mt-4"
      style={{ backgroundColor: surface, border: `1px solid ${border}` }}
    >
      {/* Mini top bar */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5"
        style={{ borderBottom: `1px solid ${border}` }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="text-[9px] ml-1" style={{ color: textMuted }}>
          Choose Module
        </span>
      </div>

      <div className="p-3 space-y-1.5">
        {moduleOptions.map((mod, i) => {
          const isActive = i === activeModule;
          return (
            <div
              key={mod.label}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-300"
              style={{
                backgroundColor: isActive ? `${mod.color}12` : "transparent",
                border: `1px solid ${isActive ? `${mod.color}40` : border}`,
                transform: isActive ? "scale(1.02)" : "scale(1)",
              }}
            >
              <span
                className="text-[11px] transition-colors duration-300"
                style={{ color: isActive ? mod.color : textMuted }}
              >
                {mod.icon}
              </span>
              <span
                className="text-[10px] font-medium transition-colors duration-300"
                style={{ color: isActive ? textPrimary : textMuted }}
              >
                {mod.label}
              </span>
              {isActive && (
                <span
                  className="ml-auto text-[8px]"
                  style={{ color: mod.color }}
                >
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Workflow preview */}
      <div
        className="px-3 py-2 transition-all duration-500"
        style={{
          borderTop: `1px solid ${border}`,
          opacity: selectedWorkflow ? 1 : 0.3,
          transform: selectedWorkflow ? "translateY(0)" : "translateY(4px)",
        }}
      >
        <span className="text-[9px]" style={{ color: accent }}>
          Social Posts
        </span>
        <span className="text-[9px] mx-1" style={{ color: textMuted }}>
          ·
        </span>
        <span className="text-[9px]" style={{ color: textMuted }}>
          Ready to generate
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   STEP 3 — Output appearing + export
   ════════════════════════════════════════════════════════════ */
export function StepThreeAnimation() {
  const [phase, setPhase] = useState<"idle" | "generating" | "output" | "exported">("idle");

  useEffect(() => {
    const cycle = () => {
      setPhase("idle");
      setTimeout(() => setPhase("generating"), 400);
      setTimeout(() => setPhase("output"), 1600);
      setTimeout(() => setPhase("exported"), 3000);
      setTimeout(cycle, 5000);
    };

    cycle();
    return () => {};
  }, []);

  return (
    <div
      className="rounded-lg overflow-hidden mt-4"
      style={{ backgroundColor: surface, border: `1px solid ${border}` }}
    >
      {/* Mini top bar */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5"
        style={{ borderBottom: `1px solid ${border}` }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span className="text-[9px] ml-1" style={{ color: textMuted }}>
          Output
        </span>
      </div>

      <div className="p-3">
        {phase === "idle" && (
          <div className="flex items-center justify-center py-6">
            <span className="text-[9px]" style={{ color: textMuted }}>
              Waiting for input...
            </span>
          </div>
        )}

        {phase === "generating" && (
          <div className="flex items-center justify-center gap-2 py-6">
            <span
              className="h-3 w-3 rounded-full border-2 animate-spin"
              style={{
                borderColor: `${accent}30`,
                borderTopColor: accent,
              }}
            />
            <span className="text-[9px]" style={{ color: textMuted }}>
              Generating...
            </span>
          </div>
        )}

        {(phase === "output" || phase === "exported") && (
          <div
            className="space-y-1.5 transition-all duration-500"
            style={{
              opacity: 1,
              transform: "translateY(0)",
            }}
          >
            {/* Output preview lines */}
            <div
              className="rounded px-2 py-1.5"
              style={{ backgroundColor: bg, border: `1px solid ${border}` }}
            >
              <div className="h-[2px] rounded mb-1.5" style={{ background: `linear-gradient(90deg, ${accent}, #818cf8)`, width: "40%" }} />
              <div className="space-y-1">
                <div className="h-1.5 rounded" style={{ backgroundColor: `${textMuted}20`, width: "95%" }} />
                <div className="h-1.5 rounded" style={{ backgroundColor: `${textMuted}20`, width: "80%" }} />
                <div className="h-1.5 rounded" style={{ backgroundColor: `${textMuted}20`, width: "88%" }} />
              </div>
            </div>
            <div
              className="rounded px-2 py-1.5"
              style={{ backgroundColor: bg, border: `1px solid ${border}` }}
            >
              <div className="h-[2px] rounded mb-1.5" style={{ background: `linear-gradient(90deg, ${accent}, #818cf8)`, width: "40%" }} />
              <div className="space-y-1">
                <div className="h-1.5 rounded" style={{ backgroundColor: `${textMuted}20`, width: "90%" }} />
                <div className="h-1.5 rounded" style={{ backgroundColor: `${textMuted}20`, width: "70%" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export bar */}
      <div
        className="px-3 py-2 flex justify-between items-center transition-all duration-500"
        style={{
          borderTop: `1px solid ${border}`,
          opacity: phase === "output" || phase === "exported" ? 1 : 0.3,
        }}
      >
        <span className="text-[9px]" style={{ color: textMuted }}>
          2 outputs ready
        </span>
        <div className="flex gap-1.5">
          <span
            className="text-[9px] px-2 py-0.5 rounded transition-all duration-300"
            style={{
              color: phase === "exported" ? bg : textMuted,
              backgroundColor: phase === "exported" ? accentTeal : "transparent",
              border: phase === "exported" ? "none" : `1px solid ${border}`,
            }}
          >
            {phase === "exported" ? "Copied ✓" : "Copy"}
          </span>
          <span
            className="text-[9px] px-2 py-0.5 rounded"
            style={{ color: textMuted, border: `1px solid ${border}` }}
          >
            Export
          </span>
        </div>
      </div>
    </div>
  );
}
