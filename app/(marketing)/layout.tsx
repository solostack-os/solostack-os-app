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

/* ── JSON-LD Structured Data ── */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "SoloStack OS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "AI Operating System for service businesses — marketing, outreach, and operations in one persistent workspace.",
      url: "https://www.solostack.io",
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "0",
          priceCurrency: "USD",
          description: "Free tier with 50 AI runs per month",
        },
        {
          "@type": "Offer",
          name: "Growth",
          price: "29",
          priceCurrency: "USD",
          priceValidUntil: "2027-12-31",
          description: "Unlimited AI runs, all modules, priority support",
        },
      ],
      featureList: [
        "Marketing OS — social posts, newsletters, blog drafts",
        "Outreach OS — cold emails, follow-ups, LinkedIn messages",
        "Operations OS — proposals, onboarding, internal docs",
        "Persistent business context across all outputs",
        "Copy, edit, and export as branded PDF",
      ],
    },
    {
      "@type": "Organization",
      name: "SoloStack",
      url: "https://www.solostack.io",
      logo: "https://www.solostack.io/logo.png",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      name: "SoloStack OS",
      url: "https://www.solostack.io",
    },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}
