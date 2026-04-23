"use client";

import Link from "next/link";
import { GlowCard } from "@/components/ui/glow-card";

/* ─── Design tokens (matching dashboard) ─── */
const accent = "#6c8cff";
const accentTeal = "#22c55e";
const accentOrange = "#f97316";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";

const heroItems = [
  {
    key: "socialPosts" as const,
    title: "Write your first LinkedIn post",
    subtitle:
      "Get in front of your network with a post tuned to your brand.",
    href: "/app/marketing",
    color: accent,
    glowColor: "blue" as const,
    gradient: "linear-gradient(90deg, #6c8cff, #818cf8)",
    iconBg: "rgba(108,140,255,0.12)",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    key: "coldEmail" as const,
    title: "Draft your first cold email",
    subtitle:
      "Reach out to a prospect with a personalized email that gets replies.",
    href: "/app/outreach",
    color: accentTeal,
    glowColor: "green" as const,
    gradient: "linear-gradient(90deg, #22c55e, #34d399)",
    iconBg: "rgba(34,197,94,0.12)",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    key: "weeklyPlan" as const,
    title: "Plan your week",
    subtitle:
      "Lay out your priorities and focus blocks for the week ahead.",
    href: "/app/operations",
    color: accentOrange,
    glowColor: "orange" as const,
    gradient: "linear-gradient(90deg, #f97316, #fb923c)",
    iconBg: "rgba(249,115,22,0.12)",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

export interface HeroCompletionState {
  socialPosts: boolean;
  coldEmail: boolean;
  weeklyPlan: boolean;
}

interface HeroCardProps {
  completion?: HeroCompletionState;
}

export function HeroCard({ completion }: HeroCardProps) {
  const completedCount = completion
    ? [completion.socialPosts, completion.coldEmail, completion.weeklyPlan].filter(Boolean).length
    : 0;

  return (
    <div>
      <p
        className="text-xs font-medium uppercase tracking-widest mb-4 px-1"
        style={{ color: textMuted }}
      >
        Your first 3 outputs
        {completedCount > 0 && (
          <span style={{ color: accent }}> — {completedCount}/3</span>
        )}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {heroItems.map((item) => {
          const done = completion?.[item.key] ?? false;

          return (
            <Link key={item.title} href={item.href} className="block h-full">
              <GlowCard glowColor={item.glowColor} className="group cursor-pointer h-full">
                <div
                  className="h-full flex flex-col transition-opacity duration-300"
                  style={{
                    backgroundColor: "rgba(17,24,39,0.85)",
                    borderRadius: "inherit",
                    opacity: done ? 0.55 : 1,
                  }}
                >
                  {/* Accent bar */}
                  <div
                    className="h-[2px] flex-shrink-0"
                    style={{
                      background: item.gradient,
                      borderRadius: "14px 14px 0 0",
                    }}
                  />

                  <div className="p-5 flex flex-col flex-1">
                    {/* Icon + checkmark row */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: item.iconBg, color: item.color }}
                      >
                        {item.icon}
                      </div>
                      {done && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "rgba(94,234,212,0.12)" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className="text-sm font-semibold mb-1.5"
                      style={{ color: textPrimary }}
                    >
                      {item.title}
                    </h3>

                    {/* Subtitle */}
                    <p
                      className="text-xs leading-relaxed mb-4 flex-1"
                      style={{ color: textMuted }}
                    >
                      {item.subtitle}
                    </p>

                    {/* CTA */}
                    <div
                      className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity duration-200 opacity-70 group-hover:opacity-100"
                      style={{ color: done ? "#5eead4" : item.color }}
                    >
                      {done ? "View" : "Start"}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
