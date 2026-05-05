"use client";

import Link from "next/link";
import { GlowCard } from "@/components/ui/glow-card";

/* ─── Design tokens (matching dashboard) ─── */
const accent = "#6c8cff";
const accentTeal = "#22c55e";
const accentOrange = "#f97316";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";

const activationCards = [
  {
    title: "Create a LinkedIn post",
    subtitle: "Turn an idea into a clear post.",
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
    title: "Write a cold email",
    subtitle: "Start a useful outreach message.",
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
    title: "Draft an SOP",
    subtitle: "Turn process knowledge into a clear operating asset.",
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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

export function ActivationPanel() {
  return (
    <div className="mb-8">
      {/* Heading */}
      <h2
        className="text-lg font-semibold mb-1"
        style={{ color: textPrimary }}
      >
        Create one useful asset in 60 seconds.
      </h2>
      <p
        className="text-sm mb-1 leading-relaxed"
        style={{ color: textMuted }}
      >
        SoloStack helps you turn what you know about your business into marketing, outreach, and operations assets.
      </p>
      <p
        className="text-xs mb-6"
        style={{ color: textMuted, opacity: 0.8 }}
      >
        No setup required to start.
      </p>

      {/* Workflow cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {activationCards.map((card) => (
          <Link key={card.title} href={card.href} className="block h-full">
            <GlowCard glowColor={card.glowColor} className="group cursor-pointer h-full">
              <div
                className="h-full flex flex-col"
                style={{
                  backgroundColor: "rgba(17,24,39,0.85)",
                  borderRadius: "inherit",
                }}
              >
                {/* Accent bar */}
                <div
                  className="h-[2px] flex-shrink-0"
                  style={{
                    background: card.gradient,
                    borderRadius: "14px 14px 0 0",
                  }}
                />

                <div className="p-5 flex flex-col flex-1">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: card.iconBg, color: card.color }}
                  >
                    {card.icon}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-sm font-semibold mb-1.5"
                    style={{ color: textPrimary }}
                  >
                    {card.title}
                  </h3>

                  {/* Subtitle */}
                  <p
                    className="text-xs leading-relaxed mb-4 flex-1"
                    style={{ color: textMuted }}
                  >
                    {card.subtitle}
                  </p>

                  {/* CTA */}
                  <div
                    className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity duration-200 opacity-70 group-hover:opacity-100"
                    style={{ color: card.color }}
                  >
                    Start
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
        ))}
      </div>

      {/* Context note */}
      <p
        className="text-xs leading-relaxed px-1"
        style={{ color: textMuted, opacity: 0.7 }}
      >
        A topic gives the AI direction. Your Business Context gives it judgment. You can add it later to make every output sharper.
      </p>
    </div>
  );
}
