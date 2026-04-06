"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/* ─── Design tokens ─── */
const bg = "#070b16";
const surface = "#111827";
const accent = "#6c8cff";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.08)";

const planDetails: Record<string, { name: string; credits: string; color: string }> = {
  trial: { name: "Trial", credits: "20 credits / month", color: accent },
  starter: { name: "Starter", credits: "200 credits / month", color: accent },
  pro: { name: "Pro", credits: "1,000 credits / month", color: "#5eead4" },
};

const upgradePaths: Record<string, { target: string; priceEnvKey: string; price: string }> = {
  trial: { target: "starter", priceEnvKey: "NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID", price: "$19/mo" },
  starter: { target: "pro", priceEnvKey: "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID", price: "$49/mo" },
};

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const [loading, setLoading] = useState(true);
  const [planKey, setPlanKey] = useState("trial");
  const [status, setStatus] = useState("trialing");
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_user_id", user.id)
        .single();
      if (!workspace) return;

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_key, status, current_period_end")
        .eq("workspace_id", workspace.id)
        .single();

      if (sub) {
        setPlanKey(sub.plan_key);
        setStatus(sub.status);
        setPeriodEnd(sub.current_period_end);
      }
      setLoading(false);
    }
    load();
  }, []);

  const plan = planDetails[planKey] ?? planDetails.trial;
  const upgrade = upgradePaths[planKey];
  const targetPlan = upgrade ? planDetails[upgrade.target] : null;

  async function handleUpgrade() {
    if (!upgrade) return;
    setUpgrading(true);

    // Price IDs are server-side env vars — map from plan key
    const priceMap: Record<string, string> = {
      starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID ?? "",
      pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "",
    };
    const priceId = priceMap[upgrade.target];

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
        <div
          className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: accent, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-8">Settings</h1>

        {/* ─── Success / Cancel banners ─── */}
        {upgraded && (
          <div
            className="rounded-lg px-4 py-3 mb-6 text-sm font-medium"
            style={{ backgroundColor: "rgba(94,234,212,0.1)", color: "#5eead4", border: "1px solid rgba(94,234,212,0.25)" }}
          >
            You&apos;re now on the {plan.name} plan!
          </div>
        )}
        {canceled && (
          <div
            className="rounded-lg px-4 py-3 mb-6 text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", color: textMuted, border: `1px solid ${border}` }}
          >
            Upgrade canceled — you&apos;re still on the {plan.name} plan.
          </div>
        )}

        {/* ─── Current Plan ─── */}
        <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: textMuted }}>
              Current Plan
            </h2>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border"
              style={{
                color: plan.color,
                borderColor: `${plan.color}4d`,
                backgroundColor: `${plan.color}14`,
              }}
            >
              {status === "active" ? "Active" : status === "trialing" ? "Trial" : status}
            </span>
          </div>

          <p className="text-xl font-bold text-white mb-1">{plan.name}</p>
          <p className="text-sm mb-3" style={{ color: textMuted }}>{plan.credits}</p>

          {periodEnd && status === "active" && (
            <p className="text-xs" style={{ color: textMuted }}>
              Renews {new Date(periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>

        {/* ─── Upgrade Card ─── */}
        {upgrade && targetPlan && (
          <div
            className="rounded-xl p-6 border"
            style={{ backgroundColor: surface, borderColor: `${accent}33` }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: textMuted }}>
              Upgrade
            </h2>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold text-white">{targetPlan.name}</p>
                <p className="text-sm" style={{ color: textMuted }}>
                  {targetPlan.credits} &middot; {upgrade.price}
                </p>
              </div>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: accent, color: "#070b16" }}
              >
                {upgrading ? "Redirecting..." : `Upgrade to ${targetPlan.name}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
