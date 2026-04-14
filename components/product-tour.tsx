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

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function isMobile() {
  return window.innerWidth < 768;
}

export function ProductTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [visible, setVisible] = useState(false);
  const pad = 8;

  const finish = useCallback(() => {
    setVisible(false);
    // Mark complete in localStorage immediately
    localStorage.setItem("solostack_tour_completed", "true");
    // Fire API call
    fetch("/api/workspace/tour-complete", { method: "POST" }).catch(() => {});
    // Short delay for fade-out, then unmount
    setTimeout(onComplete, 200);
  }, [onComplete]);

  const measure = useCallback(
    (idx: number) => {
      const s = STEPS[idx];
      const mobile = isMobile();
      const selector = mobile && s.mobileTarget ? s.mobileTarget : s.target;
      const el = document.querySelector(selector);
      if (el) {
        setTargetRect(getRect(el));
      } else { // Fallback: center of screen
        setTargetRect({ top: window.innerHeight / 3, left: window.innerWidth / 4, width: window.innerWidth / 2, height: 120 });
      }
    },
    [],
  );

  // Initial mount
  useEffect(() => {
    // Small delay so layout settles
    const t = setTimeout(() => {
      measure(0);
      setVisible(true);
    }, 300);
    return () => clearTimeout(t);
  }, [measure]);

  // Re-measure on resize
  useEffect(() => {
    const handler = () => measure(step);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [step, measure]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [finish]);

  const advance = () => {
    if (step >= STEPS.length - 1) {
      finish();
    } else {
      const next = step + 1;
      setStep(next);
      measure(next);
    }
  };

  if (!targetRect) return null;

  const mobile = isMobile();
  const current = STEPS[step];
  const description =
    mobile && current.mobileDescription
      ? current.mobileDescription
      : current.description;
  const isLast = step === STEPS.length - 1;

  const spot = {
    top: targetRect.top - pad,
    left: targetRect.left - pad,
    width: targetRect.width + pad * 2,
    height: targetRect.height + pad * 2,
  };

  // Tooltip positioning
  let tooltipStyle: React.CSSProperties;
  if (mobile) {
    // Centered above bottom nav
    tooltipStyle = {
      position: "fixed",
      bottom: 72,
      left: 16,
      right: 16,
    };
  } else {
    // Position to the right of the target, or below if not enough space
    const spaceRight = window.innerWidth - (spot.left + spot.width + 16);
    const tooltipWidth = 340;

    if (spaceRight >= tooltipWidth) {
      // Right of target
      let top = spot.top;
      // Clamp so tooltip doesn't overflow bottom
      const maxTop = window.innerHeight - 220;
      if (top > maxTop) top = maxTop;
      if (top < 16) top = 16;
      tooltipStyle = {
        position: "fixed",
        top,
        left: spot.left + spot.width + 16,
        width: tooltipWidth,
      };
    } else {
      // Below target
      let left = spot.left;
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
      if (left < 16) left = 16;
      tooltipStyle = {
        position: "fixed",
        top: spot.top + spot.height + 16,
        left,
        width: tooltipWidth,
      };
    }
  }

  const overlayBg = "rgba(0,0,0,0.6)";
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;

  return (
    <div
      className="fixed inset-0 z-[60]"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease",
        pointerEvents: visible ? "auto" : "none",
      }}
      onClick={finish}
    >
      {/* 4-div overlay: top, bottom, left, right around the spotlight cutout */}
      {/* Top */}
      <div className="fixed left-0 w-full" style={{ top: 0, height: Math.max(0, spot.top), backgroundColor: overlayBg, transition: "all 200ms ease" }} />
      {/* Bottom */}
      <div className="fixed left-0 w-full" style={{ top: spot.top + spot.height, height: Math.max(0, vh - spot.top - spot.height), backgroundColor: overlayBg, transition: "all 200ms ease" }} />
      {/* Left */}
      <div className="fixed" style={{ top: spot.top, left: 0, width: Math.max(0, spot.left), height: spot.height, backgroundColor: overlayBg, transition: "all 200ms ease" }} />
      {/* Right */}
      <div className="fixed" style={{ top: spot.top, left: spot.left + spot.width, width: Math.max(0, vw - spot.left - spot.width), height: spot.height, backgroundColor: overlayBg, transition: "all 200ms ease" }} />

      {/* Spotlight glow ring */}
      <div
        className="fixed rounded-xl pointer-events-none"
        style={{
          top: spot.top - 2,
          left: spot.left - 2,
          width: spot.width + 4,
          height: spot.height + 4,
          border: `2px solid ${accent}50`,
          boxShadow: `0 0 0 1px ${accent}25, 0 0 24px ${accent}35, inset 0 0 12px ${accent}15`,
          transition: "all 200ms ease",
        }}
      />

      {/* Tooltip card */}
      <div
        style={tooltipStyle}
        className="rounded-2xl border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div
          className="h-[2px]"
          style={{ background: `linear-gradient(90deg, ${accent}, #818cf8)` }}
        />
        <div className="p-5" style={{ backgroundColor: surface }}>
          {/* Step counter */}
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: textMuted }}>
            {step + 1} of {STEPS.length}
          </p>

          {/* Title */}
          <h3 className="text-base font-semibold mb-2" style={{ color: textPrimary }}>
            {current.title}
          </h3>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-5" style={{ color: textMuted }}>
            {description}
          </p>

          {/* Actions */}
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
