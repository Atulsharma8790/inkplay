'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Headphones, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError(error.message); return }
        router.push('/discover')
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        if (error) { setError(error.message); return }
        setSuccess('Check your email to confirm your account!')
      }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(16,185,129,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="glass" style={{ width: '100%', maxWidth: 400, padding: '40px 36px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}>
            <Headphones size={26} color="#010c07" strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: 22, marginBottom: 5 }}>
            {mode === 'login' ? 'Welcome back' : 'Join InkPlay'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', WebkitTextFillColor: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Sign in to your library' : 'Start your free audiobook journey'}
          </p>
        </div>

        {success ? (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '16px', color: 'var(--emerald-bright)', fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>
            ✓ {success}
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'signup' && (
              <div>
                <label className="label">Display Name</label>
                <input className="input" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p style={{ fontSize: 12, color: '#fca5a5', background: 'var(--red-dim)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>}

            <button type="submit" disabled={loading} className="btn btn-gold" style={{ marginTop: 4, fontSize: 15, padding: '12px' }}>
              {loading
                ? <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(1,12,7,0.3)', borderTopColor: '#010c07', borderRadius: '50%', display: 'inline-block' }} />
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 22, WebkitTextFillColor: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--emerald-light)', cursor: 'pointer', fontWeight: 600, fontSize: 13, WebkitTextFillColor: 'var(--emerald-light)' }}>
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--text-dim)', textDecoration: 'none', WebkitTextFillColor: 'var(--text-dim)' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
