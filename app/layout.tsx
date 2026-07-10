import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { PlayerBar } from '@/components/player/PlayerBar'
import { PlayerProvider } from '@/lib/PlayerContext'
import { AuthProvider } from '@/lib/AuthContext'

export const metadata: Metadata = {
  title: 'InkPlay — Audiobooks, Anytime',
  description: 'Stream premium audiobooks for free. Track your progress, build your library, listen anywhere.',
  manifest: '/manifest.json',
  authors: [{ name: 'Atul Sharma', url: 'https://atulsharma.vercel.app' }],
}

export const viewport: Viewport = {
  themeColor: '#0f0a05',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="noise-overlay" />
        <AuthProvider>
          <PlayerProvider>
            <Navbar />
            <main style={{ paddingTop: 'var(--nav-h)', paddingBottom: 'calc(var(--player-h) + 16px)', minHeight: '100vh' }}>
              {children}
            </main>
            <PlayerBar />
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
