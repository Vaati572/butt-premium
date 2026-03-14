import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Butt Premium",
  description: "CRM & Gestion commerciale",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Butt Premium",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Butt Premium" />
        <meta name="theme-color" content="#eab308" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-white">
        {children}
      </body>
    </html>
  )
}