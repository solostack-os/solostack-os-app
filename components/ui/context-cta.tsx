"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const textMuted = "#94a3b8";
const textPrimary = "#f1f5f9";
const accent = "#6c8cff";

/**
 * Lightweight post-generation CTA that prompts the user to add one
 * business detail. Saves it to workspace_context.brand_notes by appending.
 * Shows only once per session (dismissed after save or manual close).
 */
export function ContextCta() {
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!visible) return null;

  async function handleSave() {
    const detail = value.trim();
    if (!detail) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // Fetch current brand_notes to append rather than overwrite
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_user_id", user.id)
        .single();
      if (!ws) return;

      const { data: ctx } = await supabase
        .from("workspace_context")
        .select("brand_notes")
        .eq("workspace_id", ws.id)
        .single();

      const existing = ctx?.brand_notes?.trim() || "";
      const updated = existing
        ? `${existing}\n\nAdditional context:\n${detail}`
        : detail;

      await fetch("/api/workspace/context", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_notes: updated }),
      });

      setSaved(true);
      setTimeout(() => setVisible(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div
        className="mt-4 px-4 py-3 rounded-lg text-xs"
        style={{ backgroundColor: "rgba(108,140,255,0.08)", color: accent }}
      >
        Saved. Your next outputs will use this context.
      </div>
    );
  }

  return (
    <div
      className="mt-4 rounded-lg border px-4 py-3"
      style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(17,24,39,0.6)" }}
    >
      {!expanded ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs leading-relaxed" style={{ color: textMuted }}>
            Want a sharper version? Add one detail about your audience, offer, or point of view.
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setExpanded(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer"
              style={{ color: accent, backgroundColor: "rgba(108,140,255,0.1)" }}
            >
              Add
            </button>
            <button
              onClick={() => setVisible(false)}
              className="text-xs px-2 py-1.5 rounded-md transition-opacity opacity-50 hover:opacity-100 cursor-pointer"
              style={{ color: textMuted }}
              aria-label="Dismiss"
            >
              Skip
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs mb-2" style={{ color: textMuted }}>
            One sentence about your audience, offer, or point of view:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. We help solo consultants produce marketing without a team"
              className="flex-1 text-sm px-3 py-2 rounded-md border outline-none transition-colors"
              style={{
                backgroundColor: "rgba(0,0,0,0.3)",
                borderColor: "rgba(255,255,255,0.1)",
                color: textPrimary,
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={saving || !value.trim()}
              className="text-xs font-medium px-4 py-2 rounded-md transition-colors cursor-pointer disabled:opacity-40"
              style={{ color: "#fff", backgroundColor: accent }}
            >
              {saving ? "..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
