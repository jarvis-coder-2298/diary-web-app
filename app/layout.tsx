import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { Source_Serif_4 } from "next/font/google"

// ✅ Only import Google fonts that actually exist
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200","300","400","500","600","700","800","900"],
})

export const metadata: Metadata = {
  title: "MyDiary - Your Digital Sanctuary",
  description: "A comprehensive diary application for capturing your thoughts, memories, and experiences",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${sourceSerif.className}`}>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
