"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.08)";

const modules = [
  {
    name: "Marketing OS",
    description: "Generate social posts, captions, and content ideas",
    href: "/app/marketing",
    active: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    name: "Outreach OS",
    description: "Cold emails, follow-ups, and lead sequences",
    href: "#",
    active: false,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    name: "Operations OS",
    description: "SOPs, checklists, and process automation",
    href: "#",
    active: false,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [planKey, setPlanKey] = useState("trial");
  const [runsUsed, setRunsUsed] = useState(0);
  const [runCap, setRunCap] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Bootstrap workspace if needed
      const bootstrapRes = await fetch("/api/workspace/bootstrap", {
        method: "POST",
      });

      if (!bootstrapRes.ok) {
        const body = await bootstrapRes.json();
        setError(body.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      const { is_new } = await bootstrapRes.json();
      if (is_new) {
        router.push("/app/onboarding");
        return;
      }

      // Fetch dashboard data
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id, name")
        .eq("owner_user_id", user.id)
        .single();

      if (!workspace) {
        setError("Workspace not found");
        setLoading(false);
        return;
      }

      setWorkspaceName(workspace.name ?? "My Workspace");

      // Subscription + plan
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_key")
        .eq("workspace_id", workspace.id)
        .single();

      if (subscription) {
        setPlanKey(subscription.plan_key);
      }

      // Run count + cap
      const { count } = await supabase
        .from("runs")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id);

      setRunsUsed(count ?? 0);

      if (subscription) {
        const { data: plan } = await supabase
          .from("plans")
          .select("run_cap")
          .eq("key", subscription.plan_key)
          .single();

        if (plan) setRunCap(plan.run_cap);
      }

      setLoading(false);
    }

    bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: accent, borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: textMuted }}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: bg }}>
        <div
          className="rounded-xl p-8 border max-w-md text-center"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <p className="text-sm mb-4" style={{ color: "#f87171" }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent, color: bg }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const planLabel = planKey === "pro" ? "Pro" : planKey === "starter" ? "Starter" : "Trial";
  const usagePercent = runCap ? Math.min((runsUsed / runCap) * 100, 100) : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg }}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {workspaceName}
            </h1>
            <p className="text-sm mt-1" style={{ color: textMuted }}>
              Your command center
            </p>
          </div>
          <span
            className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border"
            style={{
              color: planKey === "pro" ? "#5eead4" : accent,
              borderColor: planKey === "pro" ? "rgba(94,234,212,0.3)" : "rgba(108,140,255,0.3)",
              backgroundColor: planKey === "pro" ? "rgba(94,234,212,0.08)" : "rgba(108,140,255,0.08)",
            }}
          >
            {planLabel}
          </span>
        </div>

        {/* ─── Module Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {modules.map((mod) => {
            const Tag = mod.active ? "a" : "div";
            return (
              <Tag
                key={mod.name}
                href={mod.active ? mod.href : undefined}
                className={`rounded-xl p-5 border transition-all ${
                  mod.active
                    ? "hover:border-[#6c8cff]/40 hover:bg-white/[0.02] cursor-pointer"
                    : "opacity-40 cursor-default"
                }`}
                style={{ backgroundColor: surface, borderColor: border }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div style={{ color: mod.active ? accent : textMuted }}>
                    {mod.icon}
                  </div>
                  {!mod.active && (
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        color: textMuted,
                        backgroundColor: "rgba(255,255,255,0.05)",
                      }}
                    >
                      Soon
                    </span>
                  )}
                </div>
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: mod.active ? textPrimary : textMuted }}
                >
                  {mod.name}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: textMuted }}>
                  {mod.description}
                </p>
              </Tag>
            );
          })}
        </div>

        {/* ─── Usage Bar ─── */}
        {runCap !== null && (
          <div
            className="rounded-xl p-5 border mb-10"
            style={{ backgroundColor: surface, borderColor: border }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: textPrimary }}>
                Usage
              </span>
              <span className="text-xs" style={{ color: textMuted }}>
                {runsUsed} of {runCap} credits used this month
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${usagePercent}%`,
                  backgroundColor: usagePercent >= 90 ? "#f87171" : accent,
                }}
              />
            </div>
            {(planKey === "trial" || planKey === "starter") && (
              <Link
                href="/app/settings"
                className="inline-block mt-3 text-xs font-medium transition-opacity hover:opacity-80"
                style={{ color: accent }}
              >
                Upgrade plan &rarr;
              </Link>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
