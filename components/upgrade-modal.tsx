"use client";
import { useState } from "react";

export const CREDIT_LIMIT_ERROR = "Credit limit reached. Please upgrade your plan.";

export function UpgradeModal({
  isOpen,
  onClose,
  planKey = "trial",
}: {
  isOpen: boolean;
  onClose: () => void;
  planKey?: string;
}) {
  const [upgrading, setUpgrading] = useState(false);

  async function handleUpgrade() {
    setUpgrading(true);
    const priceMap: Record<string, string> = {
      starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID ?? "",
      pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "",
    };
    const upgradePaths: Record<string, string> = {
      trial: "starter",
      starter: "pro",
    };
    const target = upgradePaths[planKey] ?? "starter";
    const priceId = priceMap[target];

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setUpgrading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        {/* Sparkle icon */}
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(108,140,255,0.12)", border: "1px solid rgba(108,140,255,0.2)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6c8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
            <path d="M20 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
          </svg>
        </div>

        <h2 className="mb-1 text-lg font-semibold text-white">You&apos;ve reached your limit</h2>
        <p className="mb-5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          Your Trial includes 30 credits. Upgrade to keep generating.
        </p>

        {/* Plan card */}
        <div
          className="mb-5 rounded-xl p-4"
          style={{ backgroundColor: "rgba(108,140,255,0.07)", border: "1px solid rgba(108,140,255,0.18)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Starter</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>300 credits / month</p>
            </div>
            <p className="text-lg font-bold text-white">
              $19<span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.45)" }}>/mo</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          className="mb-2 w-full rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "#6c8cff", color: "#fff" }}
        >
          {upgrading ? "Redirecting…" : "Upgrade to Starter"}
        </button>
        <button
          onClick={onClose}
          className="w-full rounded-xl py-2.5 text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
