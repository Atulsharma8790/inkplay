'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Library, Compass, Settings, LogOut, LogIn, User } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useState } from 'react'

const NAV = [
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/library',  label: 'My Library', icon: Library },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, profile, signOut, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 'var(--nav-h)',
      background: 'rgba(15,10,5,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#c9a84c,#8a6f30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={18} color="#0f0a05" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 700, color: 'var(--gold)', letterSpacing: '-0.02em' }}>
            Ink<span style={{ color: 'var(--text)' }}>Play</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 10,
                fontSize: 13, fontWeight: 500, textDecoration: 'none',
                background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: active ? 'var(--gold)' : 'var(--text-muted)',
                border: active ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
                transition: 'all .2s',
              }}>
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
          {profile?.is_admin && (
            <Link href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 10,
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
              background: pathname.startsWith('/admin') ? 'rgba(217,119,6,0.12)' : 'transparent',
              color: pathname.startsWith('/admin') ? 'var(--amber)' : 'var(--text-muted)',
              border: pathname.startsWith('/admin') ? '1px solid rgba(217,119,6,0.25)' : '1px solid transparent',
              transition: 'all .2s',
            }}>
              <Settings size={15} />
              Admin
            </Link>
          )}
        </nav>

        {/* Auth */}
        {!loading && (
          <div style={{ position: 'relative' }}>
            {user ? (
              <>
                <button onClick={() => setMenuOpen(p => !p)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', borderRadius: 10,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  color: 'var(--text)', cursor: 'pointer', fontSize: 13,
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a84c,#8a6f30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={13} color="#0f0a05" />
                  </div>
                  {profile?.display_name ?? 'You'}
                </button>
                {menuOpen && (
                  <div style={{
                    position: 'absolute', top: '110%', right: 0, minWidth: 160,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 12, overflow: 'hidden', zIndex: 100,
                  }}>
                    <Link href="/profile" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
                      <User size={14} /> Profile
                    </Link>
                    <button onClick={() => { signOut(); setMenuOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, background: 'none', border: 'none', width: '100%', cursor: 'pointer', borderTop: '1px solid var(--border)' }}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link href="/login" className="btn btn-gold" style={{ padding: '7px 16px', fontSize: 13 }}>
                <LogIn size={14} /> Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
