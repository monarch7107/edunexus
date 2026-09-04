import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toast";
import { AppDataProvider } from "@/components/providers/app-data";

export const metadata: Metadata = {
  title: "EduNexus — Your unified student workspace",
  description:
    "Everything a student needs to manage and improve their education, in one place. Tasks, deadlines, study planning, resources, progress and AI study priorities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppDataProvider>{children}</AppDataProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
