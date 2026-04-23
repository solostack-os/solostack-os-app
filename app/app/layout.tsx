"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MULTI_OUTPUT_WORKFLOWS } from "@/lib/constants";
import { stripMarkdown } from "@/components/ui/output-cards";
import { GoogleAdsConversion } from "@/components/GoogleAdsConversion";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const sidebarBg = "#070b16";
const surface = "#111827";
const accent = "#6c8cff";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

interface SidebarRun {
  id: string;
  workflow_key: string;
  input_json: Record<string, unknown>;
  started_at: string;
  created_at: string;
  is_sample?: boolean;
  outputs: { output_markdown: string }[];
}

const navItems = [
  {
    label: "Dashboard",
    href: "/app/dashboard",
    active: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Marketing OS",
    href: "/app/marketing",
    active: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    label: "Outreach OS",
    href: "/app/outreach",
    active: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    label: "Operations OS",
    href: "/app/operations",
    active: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/app/settings",
    active: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

function getRunTitle(run: SidebarRun): string {
  const topic = run.input_json?.topic as string | undefined;
  if (topic) return topic;
  const text = run.outputs?.[0]?.output_markdown ?? "";
  if (!text) return "Untitled credit";
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const snippet = words.slice(0, 9).join(" ");
  return words.length > 9 ? snippet + "..." : snippet;
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const workflowDotColor: Record<string, string> = {
  /* Marketing — blue */
  social_posts: "#6c8cff",
  ad_copy: "#6c8cff",
  email_campaign: "#6c8cff",
  landing_page: "#6c8cff",
  content_brief: "#6c8cff",
  /* Outreach — green */
  cold_email: "#22c55e",
  follow_up: "#22c55e",
  proposal: "#22c55e",
  discovery_prep: "#22c55e",
  /* Operations — orange */
  sop_generator: "#f97316",
  weekly_plan: "#f97316",
  onboarding_doc: "#f97316",
  process_notes: "#f97316",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [recentRuns, setRecentRuns] = useState<SidebarRun[]>([]);
  const [modalRun, setModalRun] = useState<SidebarRun | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [recentsOpen, setRecentsOpen] = useState(true);
  const [exportingRunId, setExportingRunId] = useState<string | null>(null);
  const loadRuns = useCallback(async () => {
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

    const { data: runs } = await supabase
      .from("runs")
      .select("id, workflow_key, input_json, started_at, created_at, is_sample, outputs(output_markdown)")
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (runs) setRecentRuns(runs as unknown as SidebarRun[]);
  }, []);

  useEffect(() => {
    loadRuns();
  }, [pathname, loadRuns]);

  useEffect(() => {
    const handler = () => loadRuns();
    window.addEventListener("recents:refresh", handler);
    return () => window.removeEventListener("recents:refresh", handler);
  }, [loadRuns]);

  async function handleClearAll() {
    if (!window.confirm("Delete all recent runs? This cannot be undone.")) return;
    await fetch("/api/runs/clear", { method: "DELETE" });
    setModalRun(null);
    loadRuns();
  }

  async function handleDeleteRun(e: React.MouseEvent, runId: string) {
    e.stopPropagation();
    await fetch(`/api/runs/${runId}`, { method: "DELETE" });
    if (modalRun?.id === runId) setModalRun(null);
    loadRuns();
  }

  /**
   * Re-exports a past run's output as a PDF on demand. The output text is
   * already loaded in memory (via the sidebar's loadRuns query) so we just
   * POST it to the existing PDF endpoint — no extra fetch round-trip, no
   * server-side storage of generated PDFs.
   */
  async function handleExportRun(e: React.MouseEvent, run: SidebarRun) {
    e.stopPropagation();
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

      // Reuse the server's slugged filename when available.
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
      // Sidebar rows are too cramped for a permanent error slot. Surface
      // the failure via alert() so the user gets unambiguous feedback;
      // if they dismiss and retry, state is already reset in `finally`.
      const message = err instanceof Error ? err.message : "Export failed";
      // eslint-disable-next-line no-alert
      window.alert(`PDF export failed: ${message}`);
    } finally {
      setExportingRunId(null);
    }
  }

  const handleCopyModalPost = useCallback(async (text: string, idx: number) => {
    await navigator.clipboard.writeText(stripMarkdown(text));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  function isActive(href: string) {
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function getNavAccent(href: string): { color: string; bg: string } {
    if (href.startsWith("/app/outreach"))   return { color: "#22c55e", bg: "rgba(34,197,94,0.08)" };
    if (href.startsWith("/app/operations")) return { color: "#f97316", bg: "rgba(249,115,22,0.08)" };
    return { color: accent, bg: "rgba(108,140,255,0.08)" };
  }

  const modalOutput = modalRun?.outputs?.[0]?.output_markdown ?? "";
  const modalPosts = modalOutput
    ? MULTI_OUTPUT_WORKFLOWS.has(modalRun?.workflow_key ?? "")
      ? modalOutput.split(/\n---\n/).map((p: string) => p.trim()).filter(Boolean)
      : [modalOutput.trim()]
    : [];

  return (
    <div id="app-layout-root" className="flex min-h-screen overflow-x-hidden" style={{ backgroundColor: bg }}>
      {/* Google Ads conversion tracking for new signups */}
      <Suspense fallback={null}>
        <GoogleAdsConversion />
      </Suspense>
      {/* ─── Mobile 100dvh layout fix ─── */}
      {/* Makes the layout fill exactly the VISIBLE viewport on mobile.
          The nav becomes a natural flex item at the bottom — no `position:fixed`
          jiggle on scroll — and works correctly on both Chrome (top address bar)
          and Firefox (bottom address bar). */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          #app-layout-root {
            height: 100dvh;
            min-height: 0 !important;
            flex-direction: column;
          }
          #app-layout-main {
            flex: 1 1 0%;
            min-height: 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 0 !important;
          }
          #app-layout-nav {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            right: auto !important;
            width: 100% !important;
            flex-shrink: 0;
          }
        }
      `}} />
      {/* ─── Desktop Sidebar ─── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-80 z-30 border-r"
        style={{ backgroundColor: sidebarBg, borderColor: border }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-7">
          <img src="/logo.png" alt="SoloStack OS" className="h-12 w-12 object-contain flex-shrink-0" />
          <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">
            SoloStack OS
          </span>
          <span
            className="text-[10px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ backgroundColor: accent, color: sidebarBg }}
          >
            Beta
          </span>
        </div>

        {/* Nav links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const current = isActive(item.href);
            const navAccent = getNavAccent(item.href);
            const inner = (
              <>
                <span style={{ color: current ? navAccent.color : "inherit" }}>{item.icon}</span>
                <span className="flex-1 font-medium">{item.label}</span>
                {!item.active && (
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ color: textMuted, backgroundColor: "rgba(255,255,255,0.05)" }}
                  >
                    Soon
                  </span>
                )}
              </>
            );

            const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] transition-all duration-200 relative";

            if (!item.active) {
              return (
                <div
                  key={item.label}
                  className={`${baseClasses} cursor-default opacity-40`}
                  style={{ color: textMuted }}
                >
                  {inner}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${baseClasses} cursor-pointer`}
                data-tour={item.label === "Settings" ? "settings" : item.label === "Marketing OS" ? "marketing" : undefined}
                style={{
                  color: current ? navAccent.color : textMuted,
                  backgroundColor: current ? navAccent.bg : "transparent",
                }}
              >
                {/* Active indicator bar */}
                {current && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ backgroundColor: navAccent.color }}
                  />
                )}
                {inner}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-5 mt-6 mb-2 h-px" style={{ backgroundColor: border }} />

        {/* Recent runs */}
        <div className="flex-1 px-3 flex flex-col min-h-0">
          <div className="group/recents flex items-center gap-1 px-4 mb-2 flex-shrink-0" data-tour="recents">
            <button
              onClick={() => setRecentsOpen((v) => !v)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke={textMuted}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-200"
                style={{ transform: recentsOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textMuted }}>
                Recents
              </span>
            </button>
            {recentRuns.length > 0 && (
              <button
                onClick={handleClearAll}
                className="ml-auto p-1.5 rounded-lg transition-opacity opacity-0 group-hover/recents:opacity-60 hover:!opacity-100 cursor-pointer"
                aria-label="Clear all"
                title="Clear all recents"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            )}
          </div>
          {recentsOpen && (
            <div className="custom-scrollbar overflow-y-auto space-y-0.5 flex-1 pb-4">
              {recentRuns.length === 0 && (
                <p className="px-4 text-sm" style={{ color: textMuted }}>
                  No credits yet
                </p>
              )}
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  onClick={() => { setModalRun(run); setCopiedIdx(null); }}
                  className="group w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all duration-150 hover:bg-white/[0.04] cursor-pointer"
                >
                  <span
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: workflowDotColor[run.workflow_key] ?? "#64748b",
                      boxShadow: `0 0 6px ${workflowDotColor[run.workflow_key] ?? "#64748b"}60`,
                    }}
                  />
                  <span className="text-sm truncate flex-1" style={{ color: textPrimary }}>
                    {getRunTitle(run)}
                  </span>
                  {run.is_sample && (
                    <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded" style={{ color: textMuted, backgroundColor: "rgba(108,140,255,0.08)" }}>
                      Sample
                    </span>
                  )}
                  <button
                    onClick={(e) => handleExportRun(e, run)}
                    disabled={exportingRunId === run.id || !run.outputs?.[0]?.output_markdown}
                    className={`flex-shrink-0 p-1 rounded-lg transition-opacity cursor-pointer hover:!opacity-100 disabled:cursor-not-allowed ${
                      exportingRunId === run.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-60"
                    }`}
                    aria-label="Export as PDF"
                    title="Export as PDF"
                  >
                    {exportingRunId === run.id ? (
                      <div
                        className="h-3 w-3 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: accent, borderTopColor: "transparent" }}
                      />
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDeleteRun(e, run.id)}
                    className="flex-shrink-0 p-1 rounded-lg transition-opacity opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-pointer"
                    aria-label="Delete credit"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Restart tour */}
        <div className="px-5 py-4 flex-shrink-0">
          <button
            onClick={() => {
              localStorage.removeItem("solostack_tour_completed");
              fetch("/api/workspace/tour-complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: false }),
              });
              window.dispatchEvent(new Event("tour:restart"));
            }}
            className="flex items-center gap-1.5 text-xs cursor-pointer transition-opacity opacity-50 hover:opacity-80"
            style={{ color: textMuted }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Restart tour
          </button>
        </div>
      </aside>

      {/* ─── Mobile top header ─── */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center gap-2.5 px-4 md:hidden"
        style={{
          height: 52,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: "rgba(0,0,0,0.5)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <img src="/logo.png" alt="SoloStack OS" className="h-7 w-7 object-contain" />
        <span className="text-sm font-semibold text-white tracking-tight">SoloStack OS</span>
        <span
          className="text-[9px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ backgroundColor: accent, color: sidebarBg }}
        >
          Beta
        </span>
      </header>

      {/* ─── Main content ─── */}
      <main id="app-layout-main" className="flex-1 md:ml-80 pt-[52px] md:pt-0 pb-20 md:pb-0">
        {children}
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav
        id="app-layout-nav"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
        style={{ backgroundColor: sidebarBg, borderColor: border }}
      >
        <div className="flex items-center justify-around py-3 px-1">
          {navItems.map((item) => {
            const current = isActive(item.href);
            const mobileAccent = getNavAccent(item.href);
            const label = item.label.replace(" OS", "");
            const inner = (
              <>
                <span style={{ color: current ? mobileAccent.color : textMuted }}>{item.icon}</span>
                <span
                  className="text-xs font-medium leading-none"
                  style={{ color: current ? mobileAccent.color : textMuted }}
                >
                  {label}
                </span>
              </>
            );

            if (!item.active) {
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1.5 px-2 py-1.5 rounded-xl min-w-[60px] opacity-30 cursor-default"
                >
                  {inner}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1.5 px-2 py-1.5 rounded-xl min-w-[60px] transition-colors relative"
                data-tour-mobile={item.label === "Settings" ? "settings" : item.label === "Marketing OS" ? "marketing" : item.label === "Dashboard" ? "recents" : undefined}
              >
                {/* Active dot indicator */}
                {current && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full"
                    style={{ backgroundColor: mobileAccent.color }}
                  />
                )}
                {inner}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ─── Run Output Modal ─── */}
      {modalRun && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setModalRun(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border overflow-hidden"
            style={{ backgroundColor: surface, borderColor: border }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Accent bar */}
            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, #818cf8)` }} />

            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: border }}
            >
              <div className="flex items-center gap-3 min-w-0 mr-3">
                <span className="text-base font-medium truncate" style={{ color: textPrimary }}>
                  {getRunTitle(modalRun)}
                </span>
                <span className="text-sm flex-shrink-0" style={{ color: textMuted }}>
                  {formatShortDate(modalRun.started_at)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Export PDF — reuses the same handler as the sidebar list;
                    same visual language as the button on fresh output cards. */}
                <button
                  onClick={(e) => handleExportRun(e, modalRun)}
                  disabled={exportingRunId === modalRun.id || !modalOutput}
                  className="group flex flex-col items-center gap-1 rounded-md px-2 py-1.5 transition-all opacity-60 hover:opacity-100 disabled:opacity-40 cursor-pointer"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  aria-label="Export as PDF"
                  title="Export as PDF"
                >
                  {exportingRunId === modalRun.id ? (
                    <div
                      className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: accent, borderTopColor: "transparent" }}
                    />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                  <span
                    className="text-[10px] leading-none transition-opacity opacity-0 group-hover:opacity-100"
                    style={{ color: textMuted }}
                  >
                    {exportingRunId === modalRun.id ? "..." : "PDF"}
                  </span>
                </button>
                <button
                  onClick={() => setModalRun(null)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body — per-post cards */}
            <div className="custom-scrollbar overflow-y-auto px-6 py-5 space-y-3">
              {modalPosts.length > 0 ? (
                modalPosts.map((post, idx) => {
                  const isCopied = copiedIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="relative rounded-xl border overflow-hidden group"
                      style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: border }}
                    >
                      <button
                        onClick={() => handleCopyModalPost(post, idx)}
                        className="absolute top-3 right-3 flex flex-col items-center gap-1 rounded-lg px-2.5 py-2 transition-all opacity-60 hover:opacity-100 cursor-pointer"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                        aria-label="Copy post"
                      >
                        {isCopied ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                        <span
                          className="text-[11px] leading-none transition-opacity opacity-0 group-hover:opacity-100"
                          style={{ color: isCopied ? "#5eead4" : textMuted }}
                        >
                          {isCopied ? "Done" : "Copy"}
                        </span>
                      </button>
                      <div
                        className="px-5 py-4 pr-16 text-sm leading-relaxed whitespace-pre-wrap"
                        style={{ color: textPrimary }}
                      >
                        {post}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm" style={{ color: textMuted }}>
                  No output available.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
