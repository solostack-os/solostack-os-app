import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SoloStack OS — AI Operating System for Service Businesses",
  description:
    "A persistent AI workspace for freelancers, consultants, and agencies. Marketing, outreach, and operations — one context, three modules, real outputs.",
  metadataBase: new URL("https://www.solostack.io"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SoloStack OS — AI Operating System for Service Businesses",
    description:
      "Stop restarting AI from zero. One context, three modules, real outputs — marketing, outreach, and operations for service businesses.",
    url: "https://www.solostack.io",
    siteName: "SoloStack OS",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoloStack OS — AI Operating System for Service Businesses",
    description:
      "Stop restarting AI from zero. One context, three modules, real outputs.",
  },
  keywords: [
    "AI operating system",
    "AI for freelancers",
    "AI for agencies",
    "AI for consultants",
    "marketing automation",
    "outreach automation",
    "operations automation",
    "AI workspace",
    "solostack",
  ],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${inter.variable} font-sans min-h-screen`}
      style={{ backgroundColor: "#0a0f1e", color: "#f1f5f9" }}
    >
      {children}
    </div>
  );
}
