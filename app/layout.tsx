import type { Metadata } from "next"
import { ThemeProvider } from "@/components/providers/theme"
import { ToastProvider } from "@/components/providers/toast"
import { AppDataProvider } from "@/components/providers/app-data"
import "./globals.css"

export const metadata: Metadata = {
  title: "EduNexus",
  description: "An intelligent academic command center for focused learning.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AppDataProvider>{children}</AppDataProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
