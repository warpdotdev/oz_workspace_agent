import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentOS - Autonomous AI Agent Management",
  description: "A powerful macOS desktop application for managing autonomous AI agents. Monitor, control, and orchestrate your AI workforce from a single dashboard.",
  keywords: ["AI agents", "autonomous agents", "macOS app", "agent management", "LangChain", "OpenAI", "CrewAI"],
  authors: [{ name: "AgentOS Team" }],
  openGraph: {
    title: "AgentOS - Autonomous AI Agent Management",
    description: "A powerful macOS desktop application for managing autonomous AI agents.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentOS - Autonomous AI Agent Management",
    description: "A powerful macOS desktop application for managing autonomous AI agents.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
