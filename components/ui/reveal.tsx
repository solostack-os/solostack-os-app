"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Animation variant */
  variant?: "fade-up" | "fade-in" | "fade-left" | "fade-right" | "scale-in";
  /** Delay in ms (useful for staggering siblings) */
  delay?: number;
  /** Animation duration in ms */
  duration?: number;
  /** How far into the viewport before triggering (0-1) */
  threshold?: number;
  /** Extra className */
  className?: string;
}

const variants = {
  "fade-up": { from: "translate3d(0, 32px, 0)", to: "translate3d(0, 0, 0)" },
  "fade-in": { from: "translate3d(0, 0, 0)", to: "translate3d(0, 0, 0)" },
  "fade-left": { from: "translate3d(-32px, 0, 0)", to: "translate3d(0, 0, 0)" },
  "fade-right": { from: "translate3d(32px, 0, 0)", to: "translate3d(0, 0, 0)" },
  "scale-in": { from: "scale(0.92)", to: "scale(1)" },
};

export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 600,
  threshold = 0.15,
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const v = variants[variant];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        height: "100%",
        opacity: visible ? 1 : 0,
        transform: visible ? v.to : v.from,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Helper: wraps each child with staggered delay.
 * Usage: <RevealStagger stagger={100}>{items.map(...)}</RevealStagger>
 */
interface RevealStaggerProps {
  children: ReactNode[];
  variant?: RevealProps["variant"];
  stagger?: number;
  duration?: number;
  className?: string;
}

export function RevealStagger({
  children,
  variant = "fade-up",
  stagger = 120,
  duration = 600,
  className = "",
}: RevealStaggerProps) {
  return (
    <>
      {(Array.isArray(children) ? children : [children]).map((child, i) => (
        <Reveal
          key={i}
          variant={variant}
          delay={i * stagger}
          duration={duration}
          className={className}
        >
          {child}
        </Reveal>
      ))}
    </>
  );
}
