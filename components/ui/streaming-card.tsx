"use client";

import { forwardRef } from "react";

const surface = "#111827";
const border = "rgba(255,255,255,0.06)";
const textPrimary = "#f1f5f9";

interface StreamingCardProps {
  visible: boolean;
  accent: string;
  accentLight: string;
}

/**
 * A ref-backed output card used while a workflow is streaming.
 *
 * The parent writes tokens directly into the inner text element via the
 * forwarded ref:
 *
 *     streamTextRef.current.textContent = full;
 *
 * This bypasses React state updates entirely — no reconcile, no commit,
 * no splitCards reparse — so a long stream renders as smooth typewriter
 * flow instead of a flicker on every token.
 *
 * Two details that make this work:
 *
 * 1. The card is always mounted whenever its tab is active; `visible`
 *    only toggles the `hidden` class. That keeps the ref stable from
 *    the very first render, so there's no bootstrap race where the
 *    parent tries to write before the element exists.
 *
 * 2. `contain: layout style` tells the browser that size/position
 *    changes inside this box don't affect the surrounding layout.
 *    Without it, each token append forces a page-wide layout recalc,
 *    which is the single biggest source of perceived jitter on long
 *    streams.
 *
 * Once the stream completes, the parent calls `setOutput(full)` and
 * the real `OutputCards` takes over — this card is just for the
 * in-flight phase.
 */
export const StreamingCard = forwardRef<HTMLDivElement, StreamingCardProps>(
  function StreamingCard({ visible, accent, accentLight }, ref) {
    return (
      <div
        className={visible ? "rounded-xl border overflow-hidden" : "hidden"}
        style={{ backgroundColor: surface, borderColor: border }}
      >
        <div
          className="h-[2px]"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }}
        />
        <div
          ref={ref}
          className="px-6 py-5 text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: textPrimary, contain: "layout style" }}
        />
      </div>
    );
  }
);
