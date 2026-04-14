"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ─── Design tokens (matching existing theme) ─── */
const bg = "#0a0f1e";
const surface = "#111827";
const accent = "#6c8cff";
const accentTeal = "#5eead4";
const textPrimary = "#f1f5f9";
const textMuted = "#94a3b8";
const border = "rgba(255,255,255,0.08)";

/* ─── Step definitions ─── */
const TOTAL_STEPS = 5;

const goalOptions = [
  {
    value: "leads",
    label: "Get more leads",
    description: "Outreach emails, cold DMs, follow-ups",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
      </svg>
    ),
  },
  {
    value: "content",
    label: "Create content faster",
    description: "Social posts, emails, ad copy, blogs",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
      </svg>
    ),
  },
  {
    value: "operations",
    label: "Document my processes",
    description: "SOPs, onboarding docs, weekly plans",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
      </svg>
    ),
  },
];

const toneOptions = [
  { value: "professional", label: "Professional", description: "Polished, clear, and authoritative" },
  { value: "friendly", label: "Friendly", description: "Warm, approachable, conversational" },
  { value: "bold", label: "Bold", description: "Direct, confident, high-energy" },
  { value: "minimal", label: "Minimal", description: "Short, clean, to the point" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [mainGoal, setMainGoal] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [offer, setOffer] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("");

  function canContinue() {
    switch (step) {
      case 1: return mainGoal !== "";
      case 2: return businessType.trim() !== "";
      case 3: return offer.trim() !== "";
      case 4: return targetAudience.trim() !== "";
      case 5: return tone !== "";
      default: return false;
    }
  }

  async function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    // Step 5 — save everything
    setSaving(true);
    setError(null);

    const res = await fetch("/api/workspace/context", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        main_goal: mainGoal,
        business_type: businessType,
        offer,
        target_audience: targetAudience,
        tone,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to save. Please try again.");
      setSaving(false);
      return;
    }

    sessionStorage.setItem("solostack_show_tour", "1");
    router.push("/app/dashboard");
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      {/* Progress bar */}
      <div className="w-full px-6 pt-8 pb-2">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium" style={{ color: textMuted }}>
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-xs" style={{ color: textMuted }}>
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div
            className="h-1 w-full rounded-full overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(step / TOTAL_STEPS) * 100}%`,
                background: `linear-gradient(90deg, ${accent}, ${accentTeal})`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-lg">
          {/* Step 1 — Goal */}
          {step === 1 && (
            <StepShell title="What do you need right now?">
              <div className="grid gap-3">
                {goalOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMainGoal(opt.value)}
                    className="w-full text-left rounded-xl p-4 border transition-all duration-200"
                    style={{
                      backgroundColor: mainGoal === opt.value ? "rgba(108,140,255,0.1)" : surface,
                      borderColor: mainGoal === opt.value ? accent : border,
                      boxShadow: mainGoal === opt.value ? `0 0 0 1px ${accent}` : "none",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 shrink-0"
                        style={{ color: mainGoal === opt.value ? accent : textMuted }}
                      >
                        {opt.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: textPrimary }}>
                          {opt.label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {/* Step 2 — Business type */}
          {step === 2 && (
            <StepShell title="What kind of business do you run?">
              <TextInput
                value={businessType}
                onChange={setBusinessType}
                placeholder="e.g. Marketing agency, freelance consultant, coaching business"
              />
            </StepShell>
          )}

          {/* Step 3 — Offer */}
          {step === 3 && (
            <StepShell title="What do you sell?">
              <TextInput
                value={offer}
                onChange={setOffer}
                placeholder="e.g. Social media management, business coaching, web design services"
              />
            </StepShell>
          )}

          {/* Step 4 — Audience */}
          {step === 4 && (
            <StepShell title="Who do you sell to?">
              <TextInput
                value={targetAudience}
                onChange={setTargetAudience}
                placeholder="e.g. Small business owners, startups, local service businesses"
              />
            </StepShell>
          )}

          {/* Step 5 — Tone */}
          {step === 5 && (
            <StepShell title="What tone should the AI use?">
              <div className="grid grid-cols-2 gap-3">
                {toneOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTone(opt.value)}
                    className="text-left rounded-xl p-4 border transition-all duration-200"
                    style={{
                      backgroundColor: tone === opt.value ? "rgba(108,140,255,0.1)" : surface,
                      borderColor: tone === opt.value ? accent : border,
                      boxShadow: tone === opt.value ? `0 0 0 1px ${accent}` : "none",
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: textPrimary }}>
                      {opt.label}
                    </p>
                    <p className="text-xs mt-1" style={{ color: textMuted }}>
                      {opt.description}
                    </p>
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-center mt-4" style={{ color: "#f87171" }}>
              {error}
            </p>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="text-sm font-medium px-4 py-2 rounded-lg border transition-colors hover:border-white/20"
                style={{ color: textMuted, borderColor: border }}
              >
                Back
              </button>
            ) : (
              <button
                onClick={() => { sessionStorage.setItem("solostack_show_tour", "1"); router.push("/app/dashboard"); }}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-70"
                style={{ color: textMuted }}
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canContinue() || saving}
              className="text-sm font-medium px-6 py-2.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: accent, color: bg }}
            >
              {saving
                ? "Saving..."
                : step === TOTAL_STEPS
                  ? "Finish"
                  : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared sub-components ─── */

function StepShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
        {title}
      </h2>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus
      className="w-full px-4 py-3 text-sm rounded-xl outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#6c8cff]/50"
      style={{
        backgroundColor: surface,
        border: `1px solid ${border}`,
        color: textPrimary,
      }}
    />
  );
}
