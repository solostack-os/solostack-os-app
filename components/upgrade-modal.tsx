"use client";
import { useState } from "react";

export const CREDIT_LIMIT_ERROR = "Credit limit reached. Please upgrade your plan.";

/**
 * UpgradeModal — shown whenever any module hits the credit limit.
 *
 * Behaviour by planKey:
 *  - "trial"   → single CTA: Upgrade to Starter ($19/mo, 300 credits)
 *  - "starter" → dual CTA:   Top up 100 credits ($9 one-time) + Upgrade to Pro ($39/mo)
 *  - anything else → generic upgrade to Pro
 */
export function UpgradeModal({
  isOpen,
  onClose,
  planKey = "trial",
}: {
  isOpen: boolean;
  onClose: () => void;
  planKey?: string;
}) {
  const [upgrading, setUpgrading] = useState<string | null>(null); // "starter" | "pro"
  const [refilling, setRefilling] = useState(false);

  const upgradePriceMap: Record<string, string> = {
    starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID ?? "",
    pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "",
  };

  async function handleUpgradeTo(target: "starter" | "pro") {
    setUpgrading(target);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: upgradePriceMap[target] }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setUpgrading(null);
    }
  }

  async function handleRefill() {
    setRefilling(true);
    try {
      const res = await fetch("/api/refill", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setRefilling(false);
      }
    } catch {
      setRefilling(false);
    }
  }

  if (!isOpen) return null;

  const isStarter = planKey === "starter";
  const isPro = planKey === "pro";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{
          backgroundColor: "#0d1117",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Icon */}
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: "rgba(108,140,255,0.12)",
            border: "1px solid rgba(108,140,255,0.2)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6c8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
            <path d="M20 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
          </svg>
        </div>

        <h2 className="mb-1 text-lg font-semibold text-white">
          You&apos;ve used all your credits
        </h2>
        <p className="mb-5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          {isPro
            ? "Your Pro plan includes 1,000 credits / month. Top up to keep generating."
            : isStarter
            ? "Your Starter plan includes 300 credits / month. Top up to keep going, or upgrade for more."
            : "Your Trial includes 30 credits. Pick a plan to keep generating."}
        </p>

        {isPro ? (
          /* ── Pro: top-up only ───────────────────────────────── */
          <div
            className="mb-3 rounded-xl p-4"
            style={{ backgroundColor: "rgba(94,234,212,0.07)", border: "1px solid rgba(94,234,212,0.18)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Credit Top-up</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>100 extra credits — one time</p>
              </div>
              <p className="text-lg font-bold text-white">
                $9<span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.45)" }}> once</span>
              </p>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 rounded-xl opacity-50 group-hover:opacity-75 transition-opacity blur-lg"
                style={{ background: "linear-gradient(135deg, #5eead4, #34d399)" }} />
              <button onClick={handleRefill} disabled={!!refilling}
                className="relative w-full rounded-xl py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #5eead4, #34d399)", color: "#0d1117" }}>
                {refilling ? "Redirecting…" : "⚡ Top up 100 credits"}
              </button>
            </div>
          </div>
        ) : isStarter ? (
          /* ── Starter: top-up + Pro ──────────────────────────── */
          <>
            {/* Option A — Refill */}
            <div
              className="mb-3 rounded-xl p-4"
              style={{
                backgroundColor: "rgba(108,140,255,0.07)",
                border: "1px solid rgba(108,140,255,0.18)",
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Credit Top-up</p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    100 extra credits — one time
                  </p>
                </div>
                <p className="text-lg font-bold text-white">
                  $9<span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.45)" }}> once</span>
                </p>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 rounded-xl opacity-50 group-hover:opacity-75 transition-opacity blur-lg"
                  style={{ background: "linear-gradient(135deg, #6c8cff, #818cf8)" }} />
                <button onClick={handleRefill} disabled={!!refilling || !!upgrading}
                  className="relative w-full rounded-xl py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #6c8cff, #818cf8)", color: "#fff" }}>
                  {refilling ? "Redirecting…" : "Top up 100 credits"}
                </button>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>or</span>
              <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Option B — Pro */}
            <div className="mb-3 rounded-xl p-4"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Pro Plan</p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>1,000 credits / month</p>
                </div>
                <p className="text-lg font-bold text-white">
                  $39<span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.45)" }}>/mo</span>
                </p>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 rounded-xl opacity-50 group-hover:opacity-75 transition-opacity blur-lg"
                  style={{ background: "linear-gradient(135deg, #22c55e, #34d399)" }} />
                <button onClick={() => handleUpgradeTo("pro")} disabled={!!refilling || !!upgrading}
                  className="relative w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #22c55e, #34d399)", color: "#fff" }}>
                  {upgrading === "pro" ? "Redirecting…" : "Upgrade to Pro"}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── Trial: Starter + Pro ───────────────────────────── */
          <>
            {/* Option A — Starter */}
            <div className="mb-3 rounded-xl p-4"
              style={{ backgroundColor: "rgba(108,140,255,0.07)", border: "1px solid rgba(108,140,255,0.18)" }}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Starter</p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>300 credits / month</p>
                </div>
                <p className="text-lg font-bold text-white">
                  $19<span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.45)" }}>/mo</span>
                </p>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 rounded-xl opacity-50 group-hover:opacity-75 transition-opacity blur-lg"
                  style={{ background: "linear-gradient(135deg, #6c8cff, #818cf8)" }} />
                <button onClick={() => handleUpgradeTo("starter")} disabled={!!upgrading}
                  className="relative w-full rounded-xl py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #6c8cff, #818cf8)", color: "#fff" }}>
                  {upgrading === "starter" ? "Redirecting…" : "Upgrade to Starter"}
                </button>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>or</span>
              <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Option B — Pro */}
            <div className="mb-3 rounded-xl p-4"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Pro Plan</p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>1,000 credits / month</p>
                </div>
                <p className="text-lg font-bold text-white">
                  $39<span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.45)" }}>/mo</span>
                </p>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 rounded-xl opacity-50 group-hover:opacity-75 transition-opacity blur-lg"
                  style={{ background: "linear-gradient(135deg, #22c55e, #34d399)" }} />
                <button onClick={() => handleUpgradeTo("pro")} disabled={!!upgrading}
                  className="relative w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #22c55e, #34d399)", color: "#fff" }}>
                  {upgrading === "pro" ? "Redirecting…" : "Upgrade to Pro"}
                </button>
              </div>
            </div>
          </>
        )}

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
