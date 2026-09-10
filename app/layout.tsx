import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toast";
import { AppDataProvider } from "@/components/providers/app-data";
import { ThemeProvider } from "@/components/providers/theme";
import { themeScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: {
    default: "EduNexus — Your academic intelligence system",
    template: "%s · EduNexus",
  },
  description:
    "EduNexus understands your academic context and helps you decide what to do next — while keeping you in control.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-canvas" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AppDataProvider>{children}</AppDataProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
