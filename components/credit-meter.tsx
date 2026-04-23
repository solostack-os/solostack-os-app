"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/* ─── Design tokens ─── */
const accent = "#6c8cff";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const surface = "#111827";
const border = "rgba(255,255,255,0.06)";

interface UsageData {
  remaining: number;
  creditsUsed: number;
  effectiveCap: number;
  limitReached: boolean;
  planKey: string;
  trialEndsAt: string | null;
}

const planLabels: Record<string, string> = {
  trial: "Free Trial",
  starter: "Starter",
  pro: "Pro",
};

export function CreditMeter() {
  const [data, setData] = useState<UsageData | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) return;
      const json = await res.json();
      if (json.remaining != null) setData(json);
    } catch {
      // Non-critical — meter just stays hidden until next fetch
    }
  }, []);

  // Fetch on mount and on route change
  useEffect(() => {
    fetchUsage();
  }, [pathname, fetchUsage]);

  // Refresh when a generation completes (the runs API dispatches this)
  useEffect(() => {
    const handler = () => fetchUsage();
    window.addEventListener("recents:refresh", handler);
    return () => window.removeEventListener("recents:refresh", handler);
  }, [fetchUsage]);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!data) return null;

  const { remaining, creditsUsed, effectiveCap, planKey, trialEndsAt } = data;
  const isLow = effectiveCap > 0 && remaining / effectiveCap < 0.1;
  const isTrial = planKey === "trial";

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const usagePercent = effectiveCap > 0 ? Math.min((creditsUsed / effectiveCap) * 100, 100) : 0;

  const meterColor = isLow ? "#f97316" : accent;

  return (
    <div ref={ref} className="relative">
      {/* ─── Meter pill ─── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:bg-white/[0.06] cursor-pointer"
        style={{
          border: `1px solid ${isLow ? "rgba(249,115,22,0.25)" : border}`,
          backgroundColor: isLow ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.03)",
        }}
      >
        {/* Spark icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={meterColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span
          className="text-xs font-medium tabular-nums"
          style={{ color: isLow ? "#f97316" : textMuted }}
        >
          <span className="hidden sm:inline">{remaining}/{effectiveCap} credits</span>
          <span className="sm:hidden">{remaining}</span>
        </span>
      </button>

      {/* ─── Popover ─── */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl border overflow-hidden z-50"
          style={{
            backgroundColor: surface,
            borderColor: "rgba(108,140,255,0.12)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(108,140,255,0.08)",
          }}
        >
          {/* Accent bar */}
          <div
            className="h-[2px]"
            style={{
              background: isTrial
                ? "linear-gradient(90deg, #f97316, #fbbf24)"
                : "linear-gradient(90deg, #6c8cff, #818cf8)",
            }}
          />

          <div className="p-5">
            {/* Plan name + badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: textPrimary }}>
                {planLabels[planKey] ?? planKey}
              </span>
              {isTrial && trialDaysLeft !== null && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: trialDaysLeft <= 2 ? "rgba(248,113,113,0.12)" : "rgba(251,191,36,0.1)",
                    color: trialDaysLeft <= 2 ? "#f87171" : "#fbbf24",
                  }}
                >
                  {trialDaysLeft === 0
                    ? "Expires today"
                    : trialDaysLeft === 1
                      ? "1 day left"
                      : `${trialDaysLeft} days left`}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={{ color: textMuted }}>Credits used</span>
                <span className="text-xs tabular-nums" style={{ color: textMuted }}>
                  {creditsUsed} / {effectiveCap}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usagePercent}%`,
                    background:
                      usagePercent >= 90
                        ? "linear-gradient(90deg, #f87171, #ef4444)"
                        : usagePercent >= 75
                          ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                          : isTrial
                            ? "linear-gradient(90deg, #f97316, #fbbf24)"
                            : "linear-gradient(90deg, #6c8cff, #818cf8)",
                  }}
                />
              </div>
            </div>

            {/* Remaining */}
            <p className="text-xs mb-4" style={{ color: textMuted }}>
              {remaining} credits remaining
              {!isTrial && " this period"}
            </p>

            {/* Upgrade CTAs */}
            {isTrial && (
              <div className="flex gap-2">
                <a
                  href="/app/settings"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center text-xs font-semibold py-2 rounded-lg transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #6c8cff, #818cf8)", color: "#fff" }}
                >
                  Upgrade to Starter
                </a>
                <a
                  href="/app/settings"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center text-xs font-semibold py-2 rounded-lg transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #22c55e, #34d399)", color: "#fff" }}
                >
                  Upgrade to Pro
                </a>
              </div>
            )}
            {planKey === "starter" && (
              <a
                href="/app/settings"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold py-2 rounded-lg transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #22c55e, #34d399)", color: "#fff" }}
              >
                Upgrade to Pro
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
