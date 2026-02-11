import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Agent Management Platform',
  description: 'Manage and orchestrate AI agents with full visibility and control',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  )
}
