import type { Metadata, Viewport } from "next"
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"

import "./globals.css"
import { Providers } from "./providers"

// Shared Centrely type system: Space Grotesk display · IBM Plex Sans body ·
// IBM Plex Mono for labels/data — wired to the --ff-* CSS variables.
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--ff-display",
  display: "swap",
})

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--ff-body",
  display: "swap",
})

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--ff-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Flagly — Incident Reporting",
    template: "%s · Flagly",
  },
  description:
    "Flagly — incident reporting for leisure centres. Part of the Centrely suite.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
