"use client";

import { useState } from "react";

/* ─── Shared design tokens (same across all module pages) ─── */
const surface = "#111827";
const border = "rgba(255,255,255,0.06)";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";

interface OutputCardsProps {
  cards: string[];
  copiedIdx: number | null;
  onCopy: (text: string, idx: number) => void;
  /** Accent color for the top gradient bar (module-specific). */
  accent: string;
  accentLight: string;
  /**
   * Workflow key used to name the exported PDF and title it (e.g. "cold_email").
   * When omitted, the Export PDF button is hidden.
   */
  contentType?: string;
}

export function OutputCards({
  cards,
  copiedIdx,
  onCopy,
  accent,
  accentLight,
  contentType,
}: OutputCardsProps) {
  const [exportingIdx, setExportingIdx] = useState<number | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (cards.length === 0) return null;

  async function handleExportPdf(card: string, idx: number) {
    if (!contentType) return;
    setExportingIdx(idx);
    setExportError(null);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: card, content_type: contentType }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Export failed (${res.status})`);
      }

      // Pull the filename from Content-Disposition so the browser uses the
      // same slug the server built; fall back to a generic name otherwise.
      const disposition = res.headers.get("content-disposition") || "";
      const match = /filename="?([^"]+)"?/i.exec(disposition);
      const filename = match?.[1] || `${contentType}.pdf`;

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
      const message = err instanceof Error ? err.message : "Export failed";
      setExportError(message);
      // Auto-clear the error after a few seconds so it doesn't linger.
      setTimeout(() => setExportError((e) => (e === message ? null : e)), 4000);
    } finally {
      setExportingIdx(null);
    }
  }

  return (
    <div className="space-y-4">
      <span
        className="text-[11px] font-medium uppercase tracking-wider px-0.5"
        style={{ color: textMuted }}
      >
        Output
      </span>
      {cards.map((card, idx) => {
        const isCopied = copiedIdx === idx;
        const isExporting = exportingIdx === idx;
        return (
          <div
            key={idx}
            className="relative rounded-xl border overflow-hidden group"
            style={{ backgroundColor: surface, borderColor: border }}
          >
            <div
              className="h-[2px]"
              style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }}
            />

            {/* Action buttons stack in the top-right corner */}
            <div className="absolute top-3 right-3 flex items-start gap-2">
              {contentType && (
                <button
                  onClick={() => handleExportPdf(card, idx)}
                  disabled={isExporting}
                  className="flex flex-col items-center gap-1 rounded-md px-2 py-1.5 transition-all opacity-60 hover:opacity-100 disabled:opacity-40 cursor-pointer"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  aria-label="Export as PDF"
                  title="Export as PDF"
                >
                  {isExporting ? (
                    <div
                      className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: accent, borderTopColor: "transparent" }}
                    />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={textMuted}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                  <span
                    className="text-[10px] leading-none transition-opacity opacity-0 group-hover:opacity-100"
                    style={{ color: textMuted }}
                  >
                    {isExporting ? "..." : "PDF"}
                  </span>
                </button>
              )}

              <button
                onClick={() => onCopy(card, idx)}
                className="flex flex-col items-center gap-1 rounded-md px-2 py-1.5 transition-all opacity-60 hover:opacity-100 cursor-pointer"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                aria-label="Copy"
              >
                {isCopied ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#5eead4"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={textMuted}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
            </div>

            <div
              className="px-6 py-5 pr-24 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: textPrimary }}
            >
              {card}
            </div>

            {exportError && exportingIdx === null && idx === cards.length - 1 && (
              <div
                className="px-6 pb-3 text-xs"
                style={{ color: "#f87171" }}
              >
                {exportError}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
