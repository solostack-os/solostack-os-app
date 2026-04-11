"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const REASONS = [
  { value: "pricing",         label: "Pricing didn't work for me" },
  { value: "missing_feature", label: "Missing a feature I needed" },
  { value: "too_complex",     label: "Too complex to get started" },
  { value: "not_useful",      label: "Didn't solve my problem" },
  { value: "other",           label: "Something else" },
];

function FeedbackForm() {
  const params = useSearchParams();
  const [email,   setEmail]   = useState("");
  const [reason,  setReason]  = useState("");
  const [message, setMessage] = useState("");
  const [status,  setStatus]  = useState<"idle" | "loading" | "done" | "error">("idle");
  const ref = params.get("ref") ?? "app";

  useEffect(() => {
    const emailParam = params.get("email");
    if (emailParam) setEmail(decodeURIComponent(emailParam));
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("loading");

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, reason, message, ref }),
    });

    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "rgba(108,140,255,0.15)",
          border: "1px solid rgba(108,140,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", fontSize: 22
        }}>✓</div>
        <h2 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 600, margin: "0 0 12px" }}>
          Got it. Thank you.
        </h2>
        <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.6 }}>
          This goes directly to the founder. It will be read.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
        SoloStack OS
      </h1>
      <p style={{
        color: "#6c8cff", fontSize: 12, fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 32px"
      }}>
        Feedback
      </p>

      <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
        Every great build starts with what didn&apos;t work.
      </h2>
      <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px" }}>
        Your experience shapes the next version. Takes 60 seconds.
      </p>

      {/* Email */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>
          Your email <span style={{ color: "#475569" }}>(optional)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: "100%", padding: "10px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, color: "#f1f5f9", fontSize: 14,
            outline: "none", boxSizing: "border-box"
          }}
        />
      </div>

      {/* Reason */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>
          Main reason <span style={{ color: "#475569" }}>(optional)</span>
        </label>
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px",
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, color: reason ? "#f1f5f9" : "#475569",
            fontSize: 14, outline: "none", boxSizing: "border-box",
            appearance: "none", cursor: "pointer"
          }}
        >
          <option value="">Select a reason...</option>
          {REASONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>
          Tell us more <span style={{ color: "#e2e8f0", fontSize: 12 }}>*</span>
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          rows={4}
          placeholder="What happened? What were you hoping for? Be as direct as you want."
          style={{
            width: "100%", padding: "10px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, color: "#f1f5f9", fontSize: 14,
            outline: "none", resize: "vertical",
            lineHeight: 1.6, boxSizing: "border-box",
            fontFamily: "inherit"
          }}
        />
      </div>

      {status === "error" && (
        <p style={{ color: "#f87171", fontSize: 13, marginBottom: 16 }}>
          Something went wrong. Try again or email us at support@solostack.io
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !message.trim()}
        style={{
          display: "inline-block", padding: "12px 28px",
          background: "linear-gradient(135deg,#6c8cff,#818cf8)",
          color: "#fff", border: "none", borderRadius: 10,
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          opacity: (status === "loading" || !message.trim()) ? 0.5 : 1,
          transition: "opacity 0.15s"
        }}
      >
        {status === "loading" ? "Sending..." : "Send feedback →"}
      </button>
    </form>
  );
}

export default function FeedbackPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0a0f1e",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 24px",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <Suspense fallback={null}>
          <FeedbackForm />
        </Suspense>
        <p style={{ color: "#1e293b", fontSize: 12, marginTop: 40, textAlign: "center" }}>
          © 2026 SoloStack OS
        </p>
      </div>
    </div>
  );
}
