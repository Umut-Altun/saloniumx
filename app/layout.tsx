import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import { Toaster } from "@/components/toaster"
import DbStatus from "@/components/db-status"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "BerberBook - Randevu Sistemi",
  description: "Modern berber randevu ve yönetim sistemi",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar - mobile'da pozisyonu absolute */}
            <Sidebar />
            
            {/* Main content - sidebar durumuna göre genişliği ayarlanır */}
            <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out" id="main-content">
              <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">{children}</div>
                <div className="fixed bottom-2 right-2 z-50">
                  <DbStatus />
                </div>
              </main>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}