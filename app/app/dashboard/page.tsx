"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { GlowCard } from "@/components/ui/glow-card";
import { ShinyButton } from "@/components/ui/shiny-button";
import { CREDITS_PER_RUN, MULTI_OUTPUT_WORKFLOWS } from "@/lib/constants";

// Lazy-load Three.js/WebGL background — loads after page renders so it
// doesn't block the initial bundle parse or first contentful paint.
const DottedSurface = dynamic(
  () => import("@/components/ui/dotted-surface").then((m) => ({ default: m.DottedSurface })),
  { ssr: false, loading: () => null }
);

interface RecentRun {
  id: string;
  workflow_key: string;
  module_key: string;
  created_at: string;
  outputs: { title: string | null; output_markdown: string }[];
}

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";

/* ─── Per-module themes ─── */
const moduleThemes = {
  marketing: {
    accent: "#6c8cff",
    iconBg: "rgba(108,140,255,0.12)",
    barGradient: "linear-gradient(90deg, #6c8cff, #818cf8)",
    glowColor: "blue" as const,
  },
  outreach: {
    accent: "#22c55e",
    iconBg: "rgba(34,197,94,0.12)",
    barGradient: "linear-gradient(90deg, #22c55e, #34d399)",
    glowColor: "green" as const,
  },
  operations: {
    accent: "#f97316",
    iconBg: "rgba(249,115,22,0.12)",
    barGradient: "linear-gradient(90deg, #f97316, #fb923c)",
    glowColor: "orange" as const,
  },
} as const;

type ModuleKey = keyof typeof moduleThemes;

const modules: {
  name: string;
  description: string;
  href: string;
  colorKey: ModuleKey;
  icon: React.ReactNode;
}[] = [
  {
    name: "Marketing OS",
    description:
      "Social posts, ad copy, landing pages, email campaigns, and content briefs",
    href: "/app/marketing",
    colorKey: "marketing",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    name: "Outreach OS",
    description:
      "Cold emails, follow-ups, proposals, and discovery prep sequences",
    href: "/app/outreach",
    colorKey: "outreach",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    name: "Operations OS",
    description:
      "SOPs, weekly plans, onboarding docs, checklists, and process notes",
    href: "/app/operations",
    colorKey: "operations",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
      </svg>
    ),
  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ─── Animation helper ─── */
// Replicates the framer-motion fadeUp variant with pure CSS animation.
// delay formula matches the original: 0.05 + i * 0.07 seconds.
function fadeUp(i: number): React.CSSProperties {
  return {
    animation: `du-fadeUp 0.45s cubic-bezier(0.25,1,0.5,1) both`,
    animationDelay: `${0.05 + i * 0.07}s`,
  };
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [planKey, setPlanKey] = useState("trial");
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [runsUsed, setRunsUsed] = useState(0);
  const [runCap, setRunCap] = useState<number | null>(null);
  const [extraCredits, setExtraCredits] = useState(0);
  const [refilling, setRefilling] = useState(false);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<RecentRun | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [exportingRunId, setExportingRunId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function bootstrap() {
      // ── Step 1: Bootstrap (auth is validated server-side, returns workspace_id) ──
      // We skip a client-side auth.getUser() call here — the POST endpoint reads
      // the session cookie directly, saving one full network roundtrip.
      const bootstrapRes = await fetch("/api/workspace/bootstrap", { method: "POST" });

      if (!bootstrapRes.ok) {
        const body = await bootstrapRes.json();
        setError(body.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      const { is_new, workspace_id } = await bootstrapRes.json();

      if (is_new) {
        router.push("/app/onboarding");
        return;
      }

      if (!workspace_id) {
        setError("Workspace not found");
        setLoading(false);
        return;
      }

      // ── Step 2: All dashboard data in ONE parallel batch ──────────────────────
      // Previously these were 5 sequential awaits; now they fire simultaneously.
      // We fetch all plans upfront (tiny table, 3 rows) so we don't need a
      // second sequential round-trip after learning the subscription plan_key.
      // Fetch workspace, subscription, recent runs list, and plans in parallel.
      // We don't fetch the runs count yet — it depends on the period start from
      // the subscription row, so we handle it in a second (cheap) query below.
      const [
        { data: workspace },
        { data: subscription },
        { data: runs },
        { data: plans },
      ] = await Promise.all([
        supabase.from("workspaces").select("name").eq("id", workspace_id).single(),
        supabase
          .from("subscriptions")
          .select("plan_key, trial_ends_at, current_period_start, extra_credits")
          .eq("workspace_id", workspace_id)
          .single(),
        supabase
          .from("runs")
          .select("id, workflow_key, module_key, created_at, outputs(title, output_markdown)")
          .eq("workspace_id", workspace_id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("plans").select("key, run_cap"),
      ]);

      if (!workspace) {
        setError("Workspace not found");
        setLoading(false);
        return;
      }

      setWorkspaceName(workspace.name ?? "My Workspace");
      if (runs) setRecentRuns(runs as unknown as RecentRun[]);

      if (subscription) {
        const isTrial = subscription.plan_key === "trial";
        const start = !isTrial ? subscription.current_period_start : null;

        setPlanKey(subscription.plan_key);
        if (subscription.trial_ends_at) setTrialEndsAt(subscription.trial_ends_at);
        setExtraCredits((subscription as { extra_credits?: number }).extra_credits ?? 0);

        const plan = plans?.find((p) => p.key === subscription.plan_key);
        if (plan?.run_cap != null) setRunCap(plan.run_cap);

        // Count runs within the current billing period (all runs for trial).
        // No rollover — each period starts fresh from 0.
        let countQuery = supabase
          .from("runs")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace_id);

        if (start) {
          countQuery = countQuery.gte("created_at", start);
        }

        const { count: runsCount } = await countQuery;
        setRunsUsed(runsCount ?? 0);
      }

      setLoading(false);
    }

    bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = useCallback(async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  async function handleExportRun(run: RecentRun) {
    const content = run.outputs?.[0]?.output_markdown ?? "";
    if (!content) return;
    setExportingRunId(run.id);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, content_type: run.workflow_key }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Export failed (${res.status})`);
      }
      const disposition = res.headers.get("content-disposition") || "";
      const match = /filename="?([^"]+)"?/i.exec(disposition);
      const filename = match?.[1] || `${run.workflow_key}.pdf`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[export-pdf]", err);
    } finally {
      setExportingRunId(null);
    }
  }

  /* ─── Skeleton loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: bg }}>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .skel {
            background: linear-gradient(90deg, #111827 25%, #1a2640 50%, #111827 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s ease-in-out infinite;
            border-radius: 12px;
          }
        `}</style>
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20">
          <div className="mb-16">
            <div className="skel h-12 w-72 mb-4" />
            <div className="skel h-6 w-48" />
          </div>
          <div className="skel h-28 w-full mb-16 rounded-2xl" />
          <div className="skel h-4 w-20 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skel h-56 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error state ─── */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: bg }}>
        <div className="rounded-2xl p-12 border max-w-sm text-center" style={{ backgroundColor: surface, borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: "rgba(248,113,113,0.1)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-white mb-2">Something went wrong</p>
          <p className="text-base mb-8" style={{ color: textMuted }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-base font-semibold px-8 py-3 rounded-xl transition-all hover:brightness-110 cursor-pointer"
            style={{ backgroundColor: accent, color: "#fff" }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const planLabel = planKey === "pro" ? "Pro" : planKey === "starter" ? "Starter" : "Trial";
  const creditsUsed = runsUsed * CREDITS_PER_RUN;
  const effectiveCap = (runCap ?? 0) + extraCredits;
  const creditsRemaining = effectiveCap ? Math.max(0, effectiveCap - creditsUsed) : 0;
  const usagePercent = effectiveCap ? Math.min((creditsUsed / effectiveCap) * 100, 100) : 0;
  const isOutOfCredits = effectiveCap > 0 && creditsRemaining === 0;

  async function handleRefill() {
    setRefilling(true);
    const res = await fetch("/api/refill", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setRefilling(false);
    }
  }
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const isTrial = planKey === "trial";

  return (
    <div className="relative min-h-screen isolate" style={{ backgroundColor: bg }}>
      {/* ─── Animated dotted surface background ─── */}
      <DottedSurface className="opacity-35" />

      {/* ─── Ambient background glow (clipped to viewport) ─── */}
      <div className="pointer-events-none absolute inset-x-0 top-[15%] h-[350px] overflow-hidden">
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[700px] h-full rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(108,140,255,0.12), transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-10 py-8 sm:py-12 lg:py-20">
        {/* ─── CSS keyframe for fade-up animations (replaces framer-motion) ─── */}
        <style>{`
          @keyframes du-fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
        `}</style>

        {/* ─── Header ─── */}
        <div
          style={fadeUp(0)}
          className="flex items-start justify-between mb-16"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              {getGreeting()}
            </h1>
            <p className="text-lg mt-3" style={{ color: textMuted }}>
              {workspaceName}
            </p>
          </div>
          <span
            className="text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full border mt-2"
            style={{
              color: planKey === "pro" ? "#5eead4" : accent,
              borderColor: planKey === "pro" ? "rgba(94,234,212,0.2)" : "rgba(108,140,255,0.2)",
              backgroundColor: planKey === "pro" ? "rgba(94,234,212,0.06)" : "rgba(108,140,255,0.06)",
              textShadow: `0 0 20px ${planKey === "pro" ? "rgba(94,234,212,0.5)" : "rgba(108,140,255,0.4)"}`,
            }}
          >
            {planLabel}
          </span>
        </div>

        {/* ─── Quick Generate CTA ─── */}
        <div style={fadeUp(1)} className="mb-16">
          <GlowCard glowColor="blue">
            <div className="p-8 sm:p-10" style={{ backgroundColor: "rgba(17,24,39,0.8)", borderRadius: "inherit" }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(108,140,255,0.12)" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">
                      Ready to create?
                    </h2>
                    <p className="text-base" style={{ color: textMuted }}>
                      Jump into any module and start generating
                    </p>
                  </div>
                </div>
                <ShinyButton onClick={() => router.push("/app/marketing")}>
                  Start generating &rarr;
                </ShinyButton>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* ─── Section label ─── */}
        <p
          style={{ ...fadeUp(2), color: textMuted }}
          className="text-xs font-medium uppercase tracking-widest mb-6 px-1"
        >
          Modules
        </p>

        {/* ─── Module Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {modules.map((mod, idx) => {
            const theme = moduleThemes[mod.colorKey];
            return (
              <div key={mod.name} style={fadeUp(3 + idx)}>
                <Link href={mod.href} className="block h-full">
                  <GlowCard glowColor={theme.glowColor} className="group cursor-pointer h-full">
                    <div className="h-full flex flex-col" style={{ backgroundColor: "rgba(17,24,39,0.85)", borderRadius: "inherit" }}>
                    {/* Accent bar */}
                    <div className="h-[2px] flex-shrink-0" style={{ background: theme.barGradient, borderRadius: "14px 14px 0 0" }} />

                    <div className="p-7 flex flex-col flex-1">
                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                        style={{ backgroundColor: theme.iconBg, color: theme.accent }}
                      >
                        {mod.icon}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {mod.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: textMuted }}>
                        {mod.description}
                      </p>

                      {/* Hover link */}
                      <div
                        className="flex items-center gap-1.5 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ color: theme.accent }}
                      >
                        Open
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                    </div>
                  </GlowCard>
                </Link>
              </div>
            );
          })}
        </div>

        {/* ─── Usage / Trial Bar ─── */}
        {runCap !== null && (
          <div style={fadeUp(6)}>
            <GlowCard glowColor={isTrial ? "orange" : "blue"}>
              <div className="p-7" style={{ backgroundColor: "rgba(17,24,39,0.8)", borderRadius: "inherit" }}>

                {/* ── Top accent bar — amber for trial, blue for paid ── */}
                <div
                  className="h-[2px] rounded-full mb-6 -mt-1"
                  style={{
                    background: isTrial
                      ? "linear-gradient(90deg, #f97316, #fbbf24)"
                      : "linear-gradient(90deg, #6c8cff, #818cf8)",
                  }}
                />

                {/* ── Header row ── */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    {isTrial ? (
                      <>
                        <span className="text-base font-semibold text-white">Free Trial</span>
                        {trialDaysLeft !== null && (
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: trialDaysLeft <= 2
                                ? "rgba(248,113,113,0.12)"
                                : "rgba(251,191,36,0.1)",
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
                      </>
                    ) : (
                      <span className="text-base font-medium text-white">Usage</span>
                    )}
                  </div>
                  <span className="text-sm tabular-nums" style={{ color: textMuted }}>
                    {creditsRemaining} <span style={{ color: "#64748b" }}>/ {effectiveCap} credits</span>
                  </span>
                </div>

                {/* ── Progress bar ── */}
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
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

                {/* ── Trial upgrade CTA ── */}
                {isTrial && (
                  <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      Upgrade anytime to keep access after your trial.
                    </p>
                    <Link
                      href="/app/settings"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-110 cursor-pointer flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #f97316, #fbbf24)",
                        color: "#0a0f1e",
                      }}
                    >
                      Upgrade plan &rarr;
                    </Link>
                  </div>
                )}

                {/* ── Starter CTA — top-up when exhausted, soft upgrade otherwise ── */}
                {planKey === "starter" && (
                  <div className="mt-5">
                    {isOutOfCredits ? (
                      /* Credits exhausted — show both options inline */
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleRefill}
                          disabled={refilling}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-110 disabled:opacity-60 cursor-pointer"
                          style={{
                            background: `linear-gradient(135deg, ${accent}, #818cf8)`,
                            color: "#fff",
                          }}
                        >
                          {refilling ? "Redirecting…" : "⚡ Top up 100 credits — $9"}
                        </button>
                        <Link
                          href="/app/settings"
                          className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-lg transition-all cursor-pointer"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.6)",
                          }}
                        >
                          Upgrade to Pro →
                        </Link>
                      </div>
                    ) : (
                      /* Credits available — soft upgrade nudge */
                      <Link
                        href="/app/settings"
                        className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-lg transition-all hover:brightness-110 cursor-pointer"
                        style={{ backgroundColor: "rgba(108,140,255,0.1)", color: accent }}
                      >
                        Upgrade plan →
                      </Link>
                    )}
                  </div>
                )}

              </div>
            </GlowCard>
          </div>
        )}

        {/* ─── Recent Outputs ─── */}
        {recentRuns.length > 0 && (
          <div style={fadeUp(7)} className="mt-16">
            <p
              className="text-xs font-medium uppercase tracking-widest mb-6 px-1"
              style={{ color: textMuted }}
            >
              Recent outputs
            </p>
            <div className="space-y-2">
              {recentRuns.map((run) => {
                const title = run.outputs?.[0]?.title ?? run.workflow_key.replace(/_/g, " ");
                const moduleColor =
                  run.module_key === "outreach" ? "#22c55e" :
                  run.module_key === "operations" ? "#f97316" : "#6c8cff";
                return (
                  <button
                    key={run.id}
                    onClick={() => { setSelectedRun(run); setCopiedIdx(null); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:bg-white/[0.03] cursor-pointer"
                    style={{ backgroundColor: surface, borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <span
                      className="flex-shrink-0 w-2 h-2 rounded-full"
                      style={{ backgroundColor: moduleColor, boxShadow: `0 0 6px ${moduleColor}60` }}
                    />
                    <span className="text-sm truncate flex-1" style={{ color: textPrimary }}>
                      {title}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: textMuted, fontVariantNumeric: "tabular-nums" }}>
                      {new Date(run.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Run Output Modal ─── */}
      {selectedRun && (() => {
        const output = selectedRun.outputs?.[0]?.output_markdown ?? "";
        const title = selectedRun.outputs?.[0]?.title ?? selectedRun.workflow_key.replace(/_/g, " ");
        const sections = output
          ? MULTI_OUTPUT_WORKFLOWS.has(selectedRun.workflow_key)
            ? output.split(/\n---\n/).map((p: string) => p.trim()).filter(Boolean)
            : [output.trim()]
          : [];
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRun(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border overflow-hidden"
              style={{ backgroundColor: surface, borderColor: "rgba(255,255,255,0.06)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, #818cf8)` }} />
              <div
                className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <span className="text-base font-medium truncate mr-3" style={{ color: textPrimary }}>
                  {title}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* PDF export */}
                  <button
                    onClick={() => handleExportRun(selectedRun)}
                    disabled={exportingRunId === selectedRun.id || sections.length === 0}
                    className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all opacity-60 hover:opacity-100 disabled:opacity-30 cursor-pointer"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    title="Export as PDF"
                  >
                    {exportingRunId === selectedRun.id ? (
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accent, borderTopColor: "transparent" }} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                    <span className="text-[10px]" style={{ color: textMuted }}>PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedRun(null)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto px-6 py-5 space-y-3">
                {sections.length > 0 ? sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-xl border overflow-hidden group"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <button
                      onClick={() => handleCopy(section, idx)}
                      className="absolute top-3 right-3 p-2 rounded-lg transition-all opacity-60 hover:opacity-100 cursor-pointer"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    >
                      {copiedIdx === idx ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                    <div
                      className="px-5 py-4 pr-14 text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ color: textPrimary }}
                    >
                      {section}
                    </div>
                  </div>
                )) : (
                  <p className="text-sm" style={{ color: textMuted }}>No output available.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
