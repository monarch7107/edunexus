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
    default: "EduNexus — A little more focus. A lot more possibility.",
    template: "%s · EduNexus",
  },
  description:
    "Everything a student needs to manage and improve their education, in one place. Organize your academics, find your focus, and make progress that matters.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
