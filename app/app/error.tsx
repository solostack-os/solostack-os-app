"use client";

// Required by Next.js App Router to handle runtime errors in /app/* routes.
// Without this file the dev server shows "missing required error components,
// refreshing..." on any unhandled error, causing an infinite reload loop.

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const bg = "#0a0f1e";
  const accent = "#6c8cff";
  const textPrimary = "#f1f5f9";
  const textMuted = "#94a3b8";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "420px" }}>
        <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</p>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: textPrimary,
            marginBottom: "0.5rem",
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: textMuted,
            marginBottom: "1.5rem",
          }}
        >
          {error.message ?? "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.625rem 1.25rem",
            background: accent,
            color: "#fff",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
