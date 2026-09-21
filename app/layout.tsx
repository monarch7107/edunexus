import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/providers/theme";
import { ToastProvider } from "@/components/providers/toast";
import { AppDataProvider } from "@/components/providers/app-data";
import { themeScript } from "@/lib/theme";
// Local variable fonts (design system typography — see docs/design/design-tokens.md).
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIESES — AI-Enabled Integrated Smart Education System",
  description:
    "AIESES: AI-Enabled Integrated Smart Education System for SIH 2026 (Problem Statement 26207). Adaptive learning, verified AI guidance, DIKSHA government curriculum integration, teacher portal, and student creation workspace.",
  applicationName: "AIESES",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AIESES",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563EB" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <ToastProvider>
            <AppDataProvider>{children}</AppDataProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
