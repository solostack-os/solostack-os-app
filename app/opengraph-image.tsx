import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "SoloStack OS — AI Operating System for Service Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0f1e 0%, #111827 50%, #0a0f1e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle gradient orb */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(108,140,255,0.15) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #6c8cff, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 700,
              color: "white",
            }}
          >
            S
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 700,
            color: "#f1f5f9",
            letterSpacing: "-1px",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          SoloStack OS
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "#94a3b8",
            marginTop: "16px",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          AI Operating System for Service Businesses
        </div>

        {/* Module pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "40px",
          }}
        >
          {[
            { label: "Marketing", color: "#6c8cff" },
            { label: "Outreach", color: "#5eead4" },
            { label: "Operations", color: "#f59e0b" },
          ].map((mod) => (
            <div
              key={mod.label}
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                border: `1px solid ${mod.color}44`,
                backgroundColor: `${mod.color}11`,
                color: mod.color,
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              {mod.label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "16px",
            color: "#475569",
          }}
        >
          solostack.io
        </div>
      </div>
    ),
    { ...size }
  );
}
