import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "SoloStack OS — AI Operating System for Service Businesses",
  description:
    "A persistent AI workspace for freelancers, consultants, and agencies. Marketing, outreach, and operations — one context, three modules, real outputs.",
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
