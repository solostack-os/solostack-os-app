"use client";

import { useState, useEffect, useCallback } from "react";

const accent = "#6c8cff";
const surface = "#111827";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";

interface TourStep {
  target: string;
  mobileTarget?: string;
  title: string;
  description: string;
  mobileDescription?: string;
}

const STEPS: TourStep[] = [
  {
    target: '[data-tour="settings"]',
    mobileTarget: '[data-tour-mobile="settings"]',
    title: "Set up your brand context",
    description:
      "Start here. Add your company, offer, audience, and brand voice \u2014 this is what makes every output sound like you, not a template.",
  },
  {
    target: '[data-tour="marketing"]',
    mobileTarget: '[data-tour-mobile="marketing"]',
    title: "Pick a module",
    description:
      "Choose Marketing, Outreach, or Operations based on what you need right now. Each module has ready-to-use workflows.",
  },
  {
    target: '[data-tour="main-content"]',
    title: "Generate your first output",
    description:
      "Choose a workflow, fill in a few details, and hit Generate. Your first useful output takes under a minute.",
  },
  {
    target: '[data-tour="recents"]',
    mobileTarget: '[data-tour-mobile="recents"]',
    title: "Your outputs live here",
    description:
      "Every output is saved automatically. Copy, export as PDF, or revisit anytime from the sidebar.",
    mobileDescription:
      "Every output is saved automatically. Find your past outputs on the Dashboard.",
  },
];

interface Rect { top: number; left: number; width: number; height: number }

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

export function ProductTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [spot, setSpot] = useState<Rect | null>(null);
  const [visible, setVisible] = useState(false);
  const pad = 8;

  const finish = useCallback(() => {
    setVisible(false);
    localStorage.setItem("solostack_tour_completed", "true");
    fetch("/api/workspace/tour-complete", { method: "POST" }).catch(() => {});
    setTimeout(onComplete, 250);
  }, [onComplete]);

  const measure = useCallback((idx: number) => {
    const s = STEPS[idx];
    const mobile = isMobile();
    const selector = mobile && s.mobileTarget ? s.mobileTarget : s.target;
    const el = document.querySelector(selector);
    if (el) {
      const r = el.getBoundingClientRect();
      console.log(`[tour] step ${idx} selector="${selector}" rect=`, { top: r.top, left: r.left, width: r.width, height: r.height });
      setSpot({
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
    } else {
      console.warn(`[tour] step ${idx} selector="${selector}" NOT FOUND, using fallback`);
      setSpot({
        top: window.innerHeight / 3,
        left: window.innerWidth / 4,
        width: window.innerWidth / 2,
        height: 120,
      });
    }
  }, []);

  // Mount: delay then show
  useEffect(() => {
    const t = setTimeout(() => { measure(0); setVisible(true); }, 400);
    return () => clearTimeout(t);
  }, [measure]);

  // Re-measure on resize
  useEffect(() => {
    const handler = () => measure(step);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [step, measure]);

  // Escape to dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [finish]);

  const advance = useCallback(() => {
    if (step >= STEPS.length - 1) {
      finish();
    } else {
      const next = step + 1;
      setStep(next);
      // Small delay so DOM can settle if layout shifts
      requestAnimationFrame(() => measure(next));
    }
  }, [step, finish, measure]);

  if (!spot) return null;

  const mobile = isMobile();
  const current = STEPS[step];
  const desc = mobile && current.mobileDescription ? current.mobileDescription : current.description;
  const isLast = step === STEPS.length - 1;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Tooltip positioning
  let tooltipStyle: React.CSSProperties;
  if (mobile) {
    tooltipStyle = { position: "fixed", bottom: 72, left: 16, right: 16, zIndex: 70 };
  } else {
    const spaceRight = vw - (spot.left + spot.width + 16);
    const tw = 340;
    if (spaceRight >= tw) {
      let top = spot.top;
      if (top > vh - 220) top = vh - 220;
      if (top < 16) top = 16;
      tooltipStyle = { position: "fixed", top, left: spot.left + spot.width + 16, width: tw, zIndex: 70 };
    } else {
      let left = spot.left;
      if (left + tw > vw - 16) left = vw - tw - 16;
      if (left < 16) left = 16;
      tooltipStyle = { position: "fixed", top: spot.top + spot.height + 16, left, width: tw, zIndex: 70 };
    }
  }

  // Overlay style helper — each panel gets explicit z-index
  const ov = (s: React.CSSProperties): React.CSSProperties => ({
    position: "fixed" as const,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 60,
    transition: "all 250ms ease",
    ...s,
  });

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 250ms ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* 4-panel overlay around the spotlight cutout */}
      <div style={ov({ top: 0, left: 0, right: 0, height: Math.max(0, spot.top) })} onClick={finish} />
      <div style={ov({ top: spot.top + spot.height, left: 0, right: 0, bottom: 0, height: Math.max(0, vh - spot.top - spot.height) })} onClick={finish} />
      <div style={ov({ top: spot.top, left: 0, width: Math.max(0, spot.left), height: spot.height })} onClick={finish} />
      <div style={ov({ top: spot.top, left: spot.left + spot.width, width: Math.max(0, vw - spot.left - spot.width), height: spot.height })} onClick={finish} />

      {/* Spotlight glow ring */}
      <div
        style={{
          position: "fixed",
          zIndex: 61,
          top: spot.top - 2,
          left: spot.left - 2,
          width: spot.width + 4,
          height: spot.height + 4,
          borderRadius: 12,
          border: `2px solid rgba(108,140,255,0.35)`,
          boxShadow: `0 0 0 1px rgba(108,140,255,0.15), 0 0 30px rgba(108,140,255,0.25)`,
          pointerEvents: "none",
          transition: "all 250ms ease",
        }}
      />

      {/* Tooltip card */}
      <div
        style={tooltipStyle}
        className="rounded-2xl border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, #818cf8)` }} />
        <div className="p-5" style={{ backgroundColor: surface }}>
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: textMuted }}>
            {step + 1} of {STEPS.length}
          </p>
          <h3 className="text-base font-semibold mb-2" style={{ color: textPrimary }}>
            {current.title}
          </h3>
          <p className="text-sm leading-relaxed mb-5" style={{ color: textMuted }}>
            {desc}
          </p>
          <div className="flex items-center justify-between">
            <button
              onClick={finish}
              className="text-sm cursor-pointer transition-colors hover:brightness-125"
              style={{ color: textMuted }}
            >
              Skip tour
            </button>
            <button
              onClick={advance}
              className="text-sm font-semibold px-5 py-2 rounded-lg cursor-pointer transition-all hover:brightness-110"
              style={{ backgroundColor: accent, color: "#fff" }}
            >
              {isLast ? "Start working" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
