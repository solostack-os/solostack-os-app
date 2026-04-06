"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const sidebarBg = "#070b16";
const accent = "#6c8cff";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.08)";

interface SidebarRun {
  id: string;
  workflow_key: string;
  input_json: Record<string, unknown>;
  started_at: string;
  created_at: string;
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
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
      .select("id, workflow_key, input_json, started_at, created_at, outputs(output_markdown)")
      .eq("workspace_id", workspace.id)
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

  const handleCopyModalPost = useCallback(async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  function isActive(href: string) {
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function getModuleAccent(): { color: string; bg: string } {
    if (pathname.startsWith("/app/outreach"))   return { color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
    if (pathname.startsWith("/app/operations")) return { color: "#f97316", bg: "rgba(249,115,22,0.1)" };
    return { color: accent, bg: "rgba(108,140,255,0.08)" };
  }

  function getNavAccent(href: string): { color: string; bg: string } {
    if (href.startsWith("/app/outreach"))   return { color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
    if (href.startsWith("/app/operations")) return { color: "#f97316", bg: "rgba(249,115,22,0.1)" };
    return { color: accent, bg: "rgba(108,140,255,0.08)" };
  }

  const modalOutput = modalRun?.outputs?.[0]?.output_markdown ?? "";
  const modalPosts = modalOutput
    ? modalOutput.split(/\n---\n/).map((p: string) => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: bg }}>
      {/* ─── Desktop Sidebar ─── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-80 z-30 border-r"
        style={{ backgroundColor: sidebarBg, borderColor: border }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-6">
          <img src="/logo.png" alt="SoloStack OS" className="h-8 w-8 object-contain" />
          <span className="text-sm font-bold tracking-tight" style={{ color: textPrimary }}>
            SoloStack OS
          </span>
        </div>

        {/* Nav links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const current = isActive(item.href);
            const navAccent = getNavAccent(item.href);
            const classes = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors";
            const style = {
              color: current ? navAccent.color : textMuted,
              backgroundColor: current ? navAccent.bg : "transparent",
            };
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

            if (!item.active) {
              return (
                <div key={item.label} className={`${classes} cursor-default opacity-40`} style={style}>
                  {inner}
                </div>
              );
            }

            return (
              <Link key={item.label} href={item.href} className={`${classes} cursor-pointer`} style={style}>
                {inner}
              </Link>
            );
          })}
        </nav>

        {/* Recent runs */}
        <div className="flex-1 mt-6 px-3 flex flex-col min-h-0">
          <div className="group/recents flex items-center gap-1 px-3 mb-2 flex-shrink-0">
            <button
              onClick={() => setRecentsOpen((v) => !v)}
              className="flex items-center gap-1.5"
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
                className="transition-transform"
                style={{ transform: recentsOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: textMuted }}
              >
                Recents
              </span>
            </button>
            {recentRuns.length > 0 && (
              <button
                onClick={handleClearAll}
                className="ml-auto p-1 rounded transition-opacity opacity-0 group-hover/recents:opacity-60 hover:!opacity-100"
                aria-label="Clear all"
                title="Clear all recents"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            )}
          </div>
          <style>{`
            .recents-scroll::-webkit-scrollbar { width: 6px; }
            .recents-scroll::-webkit-scrollbar-track { background: ${sidebarBg}; }
            .recents-scroll::-webkit-scrollbar-thumb { background: ${accent}; border-radius: 3px; }
            .recents-scroll::-webkit-scrollbar-thumb:hover { background: #8da6ff; }
          `}</style>
          {recentsOpen && <div className="recents-scroll overflow-y-auto space-y-0.5 flex-1">
            {recentRuns.length === 0 && (
              <p className="px-3 text-xs" style={{ color: textMuted }}>
                No credits yet
              </p>
            )}
            {recentRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => { setModalRun(run); setCopiedIdx(null); }}
                className="group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-white/[0.03] cursor-pointer"
              >
                <span
                  className="flex-shrink-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: workflowDotColor[run.workflow_key] ?? "#64748b" }}
                />
                <span className="text-xs truncate flex-1" style={{ color: textPrimary }}>
                  {getRunTitle(run)}
                </span>
                <button
                  onClick={(e) => handleDeleteRun(e, run.id)}
                  className="flex-shrink-0 p-1 rounded transition-opacity opacity-0 group-hover:opacity-60 hover:!opacity-100"
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
          </div>}
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main className="flex-1 md:ml-80 pb-20 md:pb-0">
        {children}
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t"
        style={{ backgroundColor: sidebarBg, borderColor: border }}
      >
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const current = isActive(item.href);
            const mobileAccent = getNavAccent(item.href);
            const label = item.label.replace(" OS", "");
            const inner = (
              <>
                <span style={{ color: current ? mobileAccent.color : textMuted }}>{item.icon}</span>
                <span
                  className="text-[10px] font-medium leading-none"
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
                  className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg min-w-[60px] opacity-30 cursor-default"
                >
                  {inner}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg min-w-[60px] transition-colors"
              >
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
          <div className="absolute inset-0 bg-black/60" />

          {/* Modal */}
          <div
            className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl border overflow-hidden"
            style={{ backgroundColor: "#111827", borderColor: border }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
              style={{ borderColor: border }}
            >
              <div className="flex items-center gap-2 min-w-0 mr-3">
                <span className="text-sm font-medium truncate" style={{ color: textPrimary }}>
                  {getRunTitle(modalRun)}
                </span>
                <span className="text-xs flex-shrink-0" style={{ color: textMuted }}>
                  {formatShortDate(modalRun.started_at)}
                </span>
              </div>
              <button
                onClick={() => setModalRun(null)}
                className="p-1 rounded transition-colors hover:bg-white/10 flex-shrink-0"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body — per-post cards */}
            <div className="overflow-y-auto px-5 py-4 space-y-3">
              {modalPosts.length > 0 ? (
                modalPosts.map((post, idx) => {
                  const isCopied = copiedIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="relative rounded-lg border overflow-hidden group"
                      style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: border }}
                    >
                      <button
                        onClick={() => handleCopyModalPost(post, idx)}
                        className="absolute top-2.5 right-2.5 flex flex-col items-center gap-1 rounded-md px-2 py-1.5 transition-all opacity-60 hover:opacity-100"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                        aria-label="Copy post"
                      >
                        {isCopied ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                        <span
                          className="text-[10px] leading-none transition-opacity opacity-0 group-hover:opacity-100"
                          style={{ color: isCopied ? "#5eead4" : textMuted }}
                        >
                          {isCopied ? "Done" : "Copy"}
                        </span>
                      </button>
                      <div
                        className="px-4 py-3.5 pr-14 text-sm leading-relaxed whitespace-pre-wrap"
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
