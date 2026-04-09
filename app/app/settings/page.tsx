"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { CREDITS_PER_RUN } from "@/lib/constants";

const DottedSurface = dynamic(
  () => import("@/components/ui/dotted-surface").then((m) => ({ default: m.DottedSurface })),
  { ssr: false, loading: () => null }
);

/* ─── Design tokens ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const accentLight = "#818cf8";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.06)";

const planDetails: Record<string, { name: string; credits: string; color: string }> = {
  trial: { name: "Trial", credits: "20 credits / month", color: accent },
  starter: { name: "Starter", credits: "200 credits / month", color: accent },
  pro: { name: "Pro", credits: "1,000 credits / month", color: "#5eead4" },
};

const upgradePaths: Record<string, { target: string; priceEnvKey: string; price: string }> = {
  trial: { target: "starter", priceEnvKey: "NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID", price: "$19/mo" },
  starter: { target: "pro", priceEnvKey: "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID", price: "$39/mo" },
};

/* ─── Shared input style ─── */
const inputClass = "w-full px-4 py-3 text-sm rounded-lg outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#6c8cff]/50 transition-shadow";
const inputStyle = { backgroundColor: bg, border: `1px solid ${border}`, color: textPrimary };

// Wrapped in <Suspense> below because the inner component reads
// `useSearchParams()`, which Next.js 14 requires to sit inside a suspense
// boundary so the page can be statically generated. The fallback mirrors
// the page background so nothing flashes before hydration completes.
export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen" style={{ backgroundColor: bg }} />
      }
    >
      <SettingsPageInner />
    </Suspense>
  );
}

function SettingsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const upgraded = searchParams.get("upgraded") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planKey, setPlanKey] = useState("trial");
  const [status, setStatus] = useState("trialing");
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [runCap, setRunCap] = useState<number | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
  const [profileAvailable, setProfileAvailable] = useState(true);

  /* ── Profile state ── */
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [useBrandContext, setUseBrandContext] = useState(true);
  const [brandPrimary, setBrandPrimary] = useState("#6c8cff");
  const [brandSecondary, setBrandSecondary] = useState("#22c55e");
  const [logoUrl, setLogoUrl] = useState("");
  const [legalName, setLegalName] = useState("");
  const [cui, setCui] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [includeCompanyDetails, setIncludeCompanyDetails] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

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

        // Tiered fallback (newest → oldest migrations) so the page keeps
        // working even if a migration hasn't been applied yet.
        //   tier 1: export details + brand context + profile
        //   tier 2: brand context + profile (pre export-details migration)
        //   tier 3: profile only (pre brand-context migration)
        //   tier 4: id only (pre workspace-profile migration)
        type WorkspaceRow = {
          id: string;
          company_name?: string | null;
          website?: string | null;
          industry?: string | null;
          description?: string | null;
          brand_color_primary?: string | null;
          brand_color_secondary?: string | null;
          logo_url?: string | null;
          brand_voice?: string | null;
          use_brand_context?: boolean | null;
          legal_name?: string | null;
          cui?: string | null;
          registration_number?: string | null;
          company_address?: string | null;
          company_phone?: string | null;
          company_email?: string | null;
          include_company_details?: boolean | null;
        };

        let workspace: WorkspaceRow | null = null;

        const { data: wsWithExport } = await supabase
          .from("workspaces")
          .select("id, company_name, website, industry, description, brand_color_primary, brand_color_secondary, logo_url, brand_voice, use_brand_context, legal_name, cui, registration_number, company_address, company_phone, company_email, include_company_details")
          .eq("owner_user_id", user.id)
          .single();

        if (wsWithExport) {
          workspace = wsWithExport;
        } else {
          const { data: wsWithBrand } = await supabase
            .from("workspaces")
            .select("id, company_name, website, industry, description, brand_color_primary, brand_color_secondary, logo_url, brand_voice, use_brand_context")
            .eq("owner_user_id", user.id)
            .single();

          if (wsWithBrand) {
            workspace = wsWithBrand;
          } else {
            const { data: wsProfile } = await supabase
              .from("workspaces")
              .select("id, company_name, website, industry, description, brand_color_primary, brand_color_secondary, logo_url")
              .eq("owner_user_id", user.id)
              .single();
            if (wsProfile) workspace = wsProfile;
          }
        }

        if (!workspace) {
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

          const [subRes, countRes] = await Promise.all([
            supabase
              .from("subscriptions")
              .select("plan_key, status, current_period_end, trial_ends_at")
              .eq("workspace_id", basicWs.id)
              .single(),
            supabase
              .from("runs")
              .select("id", { count: "exact", head: true })
              .eq("workspace_id", basicWs.id),
          ]);
          if (subRes.data) {
            setPlanKey(subRes.data.plan_key);
            setStatus(subRes.data.status);
            setPeriodEnd(subRes.data.current_period_end);
            setTrialEndsAt(subRes.data.trial_ends_at);
            const { data: planRow } = await supabase.from("plans").select("run_cap").eq("key", subRes.data.plan_key).single();
            if (planRow) setRunCap(planRow.run_cap);
          }
          setCreditsUsed((countRes.count ?? 0) * CREDITS_PER_RUN);
          setLoading(false);
          return;
        }

        setWorkspaceId(workspace.id);
        setCompanyName(workspace.company_name ?? "");
        setWebsite(workspace.website ?? "");
        setIndustry(workspace.industry ?? "");
        setDescription(workspace.description ?? "");
        setBrandVoice(workspace.brand_voice ?? "");
        setUseBrandContext(workspace.use_brand_context ?? true);
        setBrandPrimary(workspace.brand_color_primary ?? "#6c8cff");
        setBrandSecondary(workspace.brand_color_secondary ?? "#22c55e");
        setLogoUrl(workspace.logo_url ?? "");
        setLegalName(workspace.legal_name ?? "");
        setCui(workspace.cui ?? "");
        setRegistrationNumber(workspace.registration_number ?? "");
        setCompanyAddress(workspace.company_address ?? "");
        setCompanyPhone(workspace.company_phone ?? "");
        setCompanyEmail(workspace.company_email ?? "");
        setIncludeCompanyDetails(workspace.include_company_details ?? true);

        const [subRes2, countRes2, custRes] = await Promise.all([
          supabase
            .from("subscriptions")
            .select("plan_key, status, current_period_end, trial_ends_at")
            .eq("workspace_id", workspace.id)
            .single(),
          supabase
            .from("runs")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspace.id),
          supabase
            .from("workspaces")
            .select("stripe_customer_id")
            .eq("id", workspace.id)
            .single(),
        ]);

        if (subRes2.data) {
          setPlanKey(subRes2.data.plan_key);
          setStatus(subRes2.data.status);
          setPeriodEnd(subRes2.data.current_period_end);
          setTrialEndsAt(subRes2.data.trial_ends_at);
          const { data: planRow } = await supabase.from("plans").select("run_cap").eq("key", subRes2.data.plan_key).single();
          if (planRow) setRunCap(planRow.run_cap);
        }
        setCreditsUsed((countRes2.count ?? 0) * CREDITS_PER_RUN);
        setHasStripeCustomer(!!custRes.data?.stripe_customer_id);
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

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleManageBilling() {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setOpeningPortal(false);
    }
  }

  async function handleSaveProfile() {
    if (!workspaceId) return;
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    // Tiered save to mirror the tiered load — if a migration hasn't been
    // applied yet, drop that tier's columns and retry, so the rest of the
    // profile still persists cleanly.
    const baseProfile = {
      company_name: companyName || null,
      website: website || null,
      industry: industry || null,
      description: description || null,
      brand_color_primary: brandPrimary || "#6c8cff",
      brand_color_secondary: brandSecondary || "#22c55e",
      logo_url: logoUrl || null,
    };
    const brandContextFields = {
      brand_voice: brandVoice || null,
      use_brand_context: useBrandContext,
    };
    const exportDetailsFields = {
      legal_name: legalName || null,
      cui: cui || null,
      registration_number: registrationNumber || null,
      company_address: companyAddress || null,
      company_phone: companyPhone || null,
      company_email: companyEmail || null,
      include_company_details: includeCompanyDetails,
    };

    // Tier 1: everything
    const { error: tier1Err } = await supabase
      .from("workspaces")
      .update({ ...baseProfile, ...brandContextFields, ...exportDetailsFields })
      .eq("id", workspaceId);

    if (tier1Err) {
      // Tier 2: drop export details
      const { error: tier2Err } = await supabase
        .from("workspaces")
        .update({ ...baseProfile, ...brandContextFields })
        .eq("id", workspaceId);

      if (tier2Err) {
        // Tier 3: base profile only
        await supabase
          .from("workspaces")
          .update(baseProfile)
          .eq("id", workspaceId);
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !workspaceId) return;

    setLogoError(null);

    // Client-side size validation — the UI advertises a 2MB cap.
    const MAX_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setLogoError("File is larger than 2MB. Please choose a smaller image.");
      input.value = "";
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${workspaceId}/logo.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true, contentType: file.type || undefined });

    if (uploadErr) {
      setLogoError(uploadErr.message || "Upload failed. Please try again.");
      setUploading(false);
      input.value = "";
      return;
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    // Cache-buster so the <img> refreshes after a re-upload with the same path.
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setLogoUrl(publicUrl);

    // Persist immediately so the logo survives a refresh without the user
    // having to click "Save Profile" first.
    const { error: persistErr } = await supabase
      .from("workspaces")
      .update({ logo_url: publicUrl })
      .eq("id", workspaceId);

    if (persistErr) {
      setLogoError(`Upload succeeded but saving the URL failed: ${persistErr.message}`);
    }

    setUploading(false);
    input.value = "";
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: bg }}>
        <style>{`
          @keyframes skel-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .skel {
            background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
            background-size: 200% 100%;
            animation: skel-shimmer 1.5s ease-in-out infinite;
          }
        `}</style>
        <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
          {/* Header skeleton */}
          <div className="skel h-9 w-36 rounded-lg mb-8" />

          {/* Business Profile skeleton */}
          <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: surface, border: `1px solid ${border}` }}>
            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />
            <div className="p-7">
              <div className="skel h-4 w-36 rounded mb-5" />
              <div className="space-y-4">
                <div><div className="skel h-3 w-24 rounded mb-1.5" /><div className="skel h-11 w-full rounded-lg" /></div>
                <div><div className="skel h-3 w-20 rounded mb-1.5" /><div className="skel h-11 w-full rounded-lg" /></div>
                <div><div className="skel h-3 w-20 rounded mb-1.5" /><div className="skel h-11 w-full rounded-lg" /></div>
                <div><div className="skel h-3 w-32 rounded mb-1.5" /><div className="skel h-24 w-full rounded-lg" /></div>
              </div>
              <div className="skel h-14 w-full rounded-xl mt-6" />
            </div>
          </div>

          {/* Plan skeleton */}
          <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: surface, border: `1px solid ${border}` }}>
            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />
            <div className="p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="skel h-4 w-28 rounded" />
                <div className="skel h-6 w-16 rounded-full" />
              </div>
              <div className="skel h-8 w-24 rounded mb-1" />
              <div className="skel h-4 w-40 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: bg }}>
        <div
          className="rounded-2xl p-10 border max-w-md text-center"
          style={{ backgroundColor: surface, borderColor: border }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "rgba(248,113,113,0.1)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: textPrimary }}>Something went wrong</p>
          <p className="text-sm mb-6" style={{ color: textMuted }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent, color: "#fff" }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative isolate" style={{ backgroundColor: bg }}>
      <DottedSurface className="opacity-35" />
      <style>{`
        @keyframes gen-shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .generate-btn:not(:disabled) {
          animation: gen-shimmer 3s linear infinite;
        }
        @keyframes skel-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skel {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: skel-shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8" style={{ color: textPrimary }}>Settings</h1>

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
          <div className="rounded-xl border overflow-hidden mb-6" style={{ backgroundColor: surface, borderColor: border }}>
            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />
            <div className="p-7">
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
          </div>
        ) : (
        <div className="rounded-xl border overflow-hidden mb-6" style={{ backgroundColor: surface, borderColor: border }}>
          <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />
          <div className="p-7">
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
                className={`${inputClass} resize-none custom-scrollbar`}
                style={inputStyle}
              />
            </div>

            {/* Brand Voice */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>Brand Voice</label>
              <textarea
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                rows={3}
                placeholder="Describe your tone of voice. e.g. Warm but direct. Confident, never pushy. Use plain language — avoid jargon."
                className={`${inputClass} resize-none custom-scrollbar`}
                style={inputStyle}
              />
            </div>

            {/* Brand context toggle */}
            <div
              className="mb-5 flex items-start justify-between gap-4 rounded-lg px-4 py-3 border"
              style={{ backgroundColor: bg, borderColor: border }}
            >
              <div className="min-w-0">
                <label
                  htmlFor="use-brand-context"
                  className="block text-sm font-medium cursor-pointer"
                  style={{ color: textPrimary }}
                >
                  Apply brand context to generations
                </label>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                  Inject your company, industry, description, and brand voice into every AI generation.
                </p>
              </div>
              <button
                id="use-brand-context"
                type="button"
                role="switch"
                aria-checked={useBrandContext}
                onClick={() => setUseBrandContext((v) => !v)}
                className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#6c8cff]/50 cursor-pointer mt-0.5"
                style={{
                  backgroundColor: useBrandContext ? accent : "rgba(255,255,255,0.1)",
                }}
              >
                <span
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                  style={{
                    transform: useBrandContext ? "translateX(22px)" : "translateX(2px)",
                  }}
                />
              </button>
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
              <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>Logo</label>
              <div className="flex items-start gap-5">
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center border overflow-hidden flex-shrink-0"
                  style={{ borderColor: border, backgroundColor: bg }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-2 pt-1 min-w-0">
                  <label
                    className="px-4 py-2 text-sm font-medium rounded-lg border cursor-pointer transition-colors hover:bg-white/[0.04] w-fit"
                    style={{ color: textPrimary, borderColor: border }}
                  >
                    {uploading ? "Uploading..." : logoUrl ? "Change logo" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs" style={{ color: textMuted }}>PNG, JPG, or SVG. Max 2MB.</p>
                  {logoError && (
                    <p className="text-xs break-words" style={{ color: "#f87171" }}>
                      {logoError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Export Details ─── */}
            <div
              className="mb-6 pt-6 border-t"
              style={{ borderColor: border }}
            >
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: textMuted }}>
                Export Details
              </h3>
              <p className="text-xs mb-5" style={{ color: textMuted }}>
                Shown on PDF exports like invoices and proposals.
              </p>

              {/* Legal name */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>Legal name</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Your Company "
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              {/* VAT / TIN / CUI Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>VAT/TIN/CUI Number</label>
                <input
                  type="text"
                  value={cui}
                  onChange={(e) => setCui(e.target.value)}
                  placeholder="e.g. RO12345678"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              {/* Registration number */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>Registration number</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. J40/1234/2024"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              {/* Address (optional) */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>
                  Address
                  <span className="ml-1 text-xs font-normal" style={{ color: textMuted }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="e.g. Fifth Avenue Street"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              {/* Phone (optional) */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>
                  Phone
                  <span className="ml-1 text-xs font-normal" style={{ color: textMuted }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="e.g. +40 700 000 000"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              {/* Email (optional) */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5" style={{ color: textPrimary }}>
                  Email
                  <span className="ml-1 text-xs font-normal" style={{ color: textMuted }}>(optional)</span>
                </label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="e.g. office@yourcompany.com"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              {/* Include company details toggle */}
              <div
                className="flex items-start justify-between gap-4 rounded-lg px-4 py-3 border"
                style={{ backgroundColor: bg, borderColor: border }}
              >
                <div className="min-w-0">
                  <label
                    htmlFor="include-company-details"
                    className="block text-sm font-medium cursor-pointer"
                    style={{ color: textPrimary }}
                  >
                    Include company details in PDF exports
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                    When enabled, the fields above are rendered into exported documents.
                  </p>
                </div>
                <button
                  id="include-company-details"
                  type="button"
                  role="switch"
                  aria-checked={includeCompanyDetails}
                  onClick={() => setIncludeCompanyDetails((v) => !v)}
                  className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#6c8cff]/50 cursor-pointer mt-0.5"
                  style={{
                    backgroundColor: includeCompanyDetails ? accent : "rgba(255,255,255,0.1)",
                  }}
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                    style={{
                      transform: includeCompanyDetails ? "translateX(22px)" : "translateX(2px)",
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Save */}
            <div className="relative group mt-1">
              {!saving && (
                <div
                  className="absolute -inset-1 rounded-2xl opacity-60 group-hover:opacity-80 transition-opacity blur-xl"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accentLight})` }}
                />
              )}
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="relative w-full py-4 text-base font-semibold rounded-xl transition-all disabled:opacity-30 cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accentLight})`,
                  color: "#fff",
                }}
              >
                {saving ? "Saving..." : saved ? "Saved \u2713" : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
        )}

        {/* ─── Plan & Billing ─── */}
        <div className="rounded-xl border overflow-hidden mb-6" style={{ backgroundColor: surface, borderColor: border }}>
          <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />
          <div className="p-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: textMuted }}>
                Plan & Billing
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

            <p className="text-2xl font-bold text-white mb-1">{plan.name}</p>

            {/* Credits remaining */}
            {runCap !== null && (
              <p className="text-sm mb-1" style={{ color: textMuted, fontVariantNumeric: "tabular-nums" }}>
                {Math.max(0, runCap - creditsUsed)} / {runCap} credits remaining
              </p>
            )}

            {/* Trial days remaining */}
            {status === "trialing" && trialEndsAt && (() => {
              const days = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              return (
                <p className="text-xs mt-1" style={{ color: days <= 2 ? "#fbbf24" : textMuted }}>
                  {days === 0 ? "Trial expires today" : `${days} day${days !== 1 ? "s" : ""} left in trial`}
                </p>
              );
            })()}

            {periodEnd && status === "active" && (
              <p className="text-xs mt-1" style={{ color: textMuted, fontVariantNumeric: "tabular-nums" }}>
                Renews {new Date(periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}

            {/* Billing actions */}
            <div className="flex flex-wrap gap-3 mt-5">
              {hasStripeCustomer && (
                <button
                  onClick={handleManageBilling}
                  disabled={openingPortal}
                  className="px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors hover:bg-white/[0.04] cursor-pointer disabled:opacity-50"
                  style={{ color: textPrimary, borderColor: border }}
                >
                  {openingPortal ? "Opening..." : "Manage Billing"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Upgrade Card ─── */}
        {upgrade && targetPlan && (
          <div
            className="rounded-xl border overflow-hidden mb-6"
            style={{ backgroundColor: surface, borderColor: `${accent}33` }}
          >
            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />
            <div className="p-7">
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
                <div className="relative group">
                  <div
                    className="absolute -inset-1 rounded-2xl opacity-60 group-hover:opacity-80 transition-opacity blur-xl"
                    style={{ background: `linear-gradient(135deg, ${accent}, ${accentLight})` }}
                  />
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="relative px-8 py-3 rounded-xl text-base font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${accentLight})`,
                      color: "#fff",
                    }}
                  >
                    {upgrading ? "Redirecting..." : `Upgrade to ${targetPlan.name}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Sign Out ─── */}
        <div className="pt-6 mt-2 border-t" style={{ borderColor: border }}>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full py-3 text-sm font-medium rounded-xl border transition-colors hover:bg-white/[0.04] cursor-pointer disabled:opacity-50"
            style={{ color: "#f87171", borderColor: "rgba(248,113,113,0.2)" }}
          >
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
