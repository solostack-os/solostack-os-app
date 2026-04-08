"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { GlowCard } from "@/components/ui/glow-card";
import { ShinyButton } from "@/components/ui/shiny-button";
import { DottedSurface } from "@/components/ui/dotted-surface";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
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
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transition: { delay: 0.05 + i * 0.07, duration: 0.45, ease: [0.25, 1, 0.5, 1] as any },
  }),
};

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

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_key")
        .eq("workspace_id", workspace.id)
        .single();

      if (subscription) {
        setPlanKey(subscription.plan_key);
      }

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
  const usagePercent = runCap ? Math.min((runsUsed / runCap) * 100, 100) : 0;

  return (
    <div className="relative min-h-screen isolate" style={{ backgroundColor: bg }}>
      {/* ─── Animated dotted surface background ─── */}
      <DottedSurface className="opacity-35" />

      {/* ─── Ambient background glow ─── */}
      <div
        className="pointer-events-none absolute left-1/2 top-[15%] -translate-x-1/2 w-[700px] h-[350px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(108,140,255,0.12), transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-10 py-12 lg:py-20">
        {/* ─── Header ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
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
        </motion.div>

        {/* ─── Quick Generate CTA ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
          className="mb-16"
        >
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
        </motion.div>

        {/* ─── Section label ─── */}
        <motion.p
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
          className="text-xs font-medium uppercase tracking-widest mb-6 px-1"
          style={{ color: textMuted }}
        >
          Modules
        </motion.p>

        {/* ─── Module Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {modules.map((mod, idx) => {
            const theme = moduleThemes[mod.colorKey];
            return (
              <motion.div
                key={mod.name}
                initial="hidden"
                animate="visible"
                custom={3 + idx}
                variants={fadeUp}
              >
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
              </motion.div>
            );
          })}
        </div>

        {/* ─── Usage Bar ─── */}
        {runCap !== null && (
          <motion.div
            initial="hidden"
            animate="visible"
            custom={6}
            variants={fadeUp}
          >
            <GlowCard glowColor="blue">
              <div className="p-7" style={{ backgroundColor: "rgba(17,24,39,0.8)", borderRadius: "inherit" }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-medium text-white">Usage</span>
                  <span className="text-sm" style={{ color: textMuted, fontVariantNumeric: "tabular-nums" }}>
                    {runsUsed} / {runCap} credits
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${usagePercent}%`,
                      background:
                        usagePercent >= 90
                          ? "linear-gradient(90deg, #f87171, #ef4444)"
                          : usagePercent >= 75
                            ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                            : "linear-gradient(90deg, #6c8cff, #818cf8)",
                    }}
                  />
                </div>
                {(planKey === "trial" || planKey === "starter") && (
                  <div className="mt-5">
                    <Link
                      href="/app/settings"
                      className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-lg transition-all hover:brightness-110 cursor-pointer"
                      style={{ backgroundColor: "rgba(108,140,255,0.1)", color: accent }}
                    >
                      Upgrade plan &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </GlowCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
