import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/providers/theme";
import { ToastProvider } from "@/components/providers/toast";
import { AppDataProvider } from "@/components/providers/app-data";
import { themeScript } from "@/lib/theme";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LearnVerse AI — Your Personal Learning Universe",
    template: "%s | LearnVerse AI",
  },
  description:
    "Turn courses, articles, videos, documents and projects into a personalized learning journey. Learn, practice, build skills and track your progress with LearnVerse AI.",
  applicationName: "LearnVerse AI",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LearnVerse",
  },
  openGraph: {
    title: "LearnVerse AI — Your Personal Learning Universe",
    description:
      "Learn anything, from anywhere, with an adaptive learning journey built around you.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563EB" },
    { media: "(prefers-color-scheme: dark)", color: "#05060B" },
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
