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

/* ─── Shared input style ─── */
const inputClass = "w-full px-4 py-3 text-sm rounded-lg outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#6c8cff]/50";
const inputStyle = { backgroundColor: bg, border: `1px solid ${border}`, color: textPrimary };

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planKey, setPlanKey] = useState("trial");
  const [status, setStatus] = useState("trialing");
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [profileAvailable, setProfileAvailable] = useState(true);

  /* ── Profile state ── */
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [brandPrimary, setBrandPrimary] = useState("#6c8cff");
  const [brandSecondary, setBrandSecondary] = useState("#22c55e");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        // Try fetching with profile columns first
        const { data: workspace, error: wsError } = await supabase
          .from("workspaces")
          .select("id, company_name, website, industry, description, brand_color_primary, brand_color_secondary, logo_url")
          .eq("owner_user_id", user.id)
          .single();

        if (wsError || !workspace) {
          // Profile columns may not exist yet — fall back to basic query
          const { data: basicWs, error: basicErr } = await supabase
            .from("workspaces")
            .select("id")
            .eq("owner_user_id", user.id)
            .single();

          if (basicErr || !basicWs) {
            setError("Workspace not found. Complete onboarding first.");
            setLoading(false);
            return;
          }

          setWorkspaceId(basicWs.id);
          setProfileAvailable(false);

          const { data: sub } = await supabase
            .from("subscriptions")
            .select("plan_key, status, current_period_end")
            .eq("workspace_id", basicWs.id)
            .single();
          if (sub) {
            setPlanKey(sub.plan_key);
            setStatus(sub.status);
            setPeriodEnd(sub.current_period_end);
          }
          setLoading(false);
          return;
        }

        setWorkspaceId(workspace.id);
        setCompanyName(workspace.company_name ?? "");
        setWebsite(workspace.website ?? "");
        setIndustry(workspace.industry ?? "");
        setDescription(workspace.description ?? "");
        setBrandPrimary(workspace.brand_color_primary ?? "#6c8cff");
        setBrandSecondary(workspace.brand_color_secondary ?? "#22c55e");
        setLogoUrl(workspace.logo_url ?? "");

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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
        setLoading(false);
      }
    }
    load();
  }, []);

  const plan = planDetails[planKey] ?? planDetails.trial;
  const upgrade = upgradePaths[planKey];
  const targetPlan = upgrade ? planDetails[upgrade.target] : null;

  async function handleUpgrade() {
    if (!upgrade) return;
    setUpgrading(true);

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

  async function handleSaveProfile() {
    if (!workspaceId) return;
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    await supabase
      .from("workspaces")
      .update({
        company_name: companyName || null,
        website: website || null,
        industry: industry || null,
        description: description || null,
        brand_color_primary: brandPrimary || "#6c8cff",
        brand_color_secondary: brandSecondary || "#22c55e",
        logo_url: logoUrl || null,
      })
      .eq("id", workspaceId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !workspaceId) return;

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${workspaceId}/logo.${ext}`;

    const { error } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
    }
    setUploading(false);
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: bg }}>
        <div
          className="rounded-xl p-8 border max-w-md text-center"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <p className="text-sm mb-4" style={{ color: "#f87171" }}>{error}</p>
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

        {/* ─── Business Profile ─── */}
        {!profileAvailable ? (
          <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: textMuted }}>
              Business Profile
            </h2>
            <p className="text-sm mb-2" style={{ color: textMuted }}>
              Profile columns haven&apos;t been added to the database yet.
            </p>
            <p className="text-xs" style={{ color: textMuted }}>
              Run the migration in <span style={{ color: textPrimary }}>supabase/migrations/add_workspace_profile.sql</span> via the Supabase SQL Editor, then reload this page.
            </p>
          </div>
        ) : (
        <div className="rounded-xl p-6 border mb-6" style={{ backgroundColor: surface, borderColor: border }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: textMuted }}>
            Business Profile
          </h2>

          {/* Company Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Studio"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Website */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>Website</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Industry */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Marketing, Design, Consulting"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>Business Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what you do, who you serve, and your brand voice. This is used by AI to personalize all outputs."
              className={`${inputClass} resize-none`}
              style={inputStyle}
            />
          </div>

          {/* Brand Colors */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>Brand Colors</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: textMuted }}>Primary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={brandPrimary}
                    onChange={(e) => setBrandPrimary(e.target.value)}
                    placeholder="#6c8cff"
                    maxLength={7}
                    className={`${inputClass} flex-1`}
                    style={inputStyle}
                  />
                  <div
                    className="w-6 h-6 rounded flex-shrink-0 border"
                    style={{ backgroundColor: brandPrimary, borderColor: border }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: textMuted }}>Secondary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={brandSecondary}
                    onChange={(e) => setBrandSecondary(e.target.value)}
                    placeholder="#22c55e"
                    maxLength={7}
                    className={`${inputClass} flex-1`}
                    style={inputStyle}
                  />
                  <div
                    className="w-6 h-6 rounded flex-shrink-0 border"
                    style={{ backgroundColor: brandSecondary, borderColor: border }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>Logo</label>
            <div className="flex items-center gap-4">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-12 h-12 rounded-lg object-contain border"
                  style={{ borderColor: border, backgroundColor: bg }}
                />
              )}
              <label
                className="px-4 py-2 text-sm rounded-lg border cursor-pointer transition-colors hover:bg-white/[0.03]"
                style={{ color: textMuted, borderColor: border }}
              >
                {uploading ? "Uploading..." : logoUrl ? "Change logo" : "Upload logo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-3 text-sm font-medium rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: accent, color: bg }}
          >
            {saving ? "Saving..." : saved ? "Saved \u2713" : "Save Profile"}
          </button>
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
