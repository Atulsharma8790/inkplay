'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff } from 'lucide-react'
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
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: '36px 32px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#c9a84c,#8a6f30)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <BookOpen size={24} color="#0f0a05" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>
            {mode === 'login' ? 'Welcome back' : 'Join InkPlay'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Sign in to your library' : 'Start your free audiobook journey'}
          </p>
        </div>

        {success ? (
          <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '14px 16px', color: '#86efac', fontSize: 13, textAlign: 'center' }}>
            {success}
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

            {error && <p style={{ fontSize: 12, color: '#fca5a5', background: 'var(--red-dim)', padding: '8px 12px', borderRadius: 8 }}>{error}</p>}

            <button type="submit" disabled={loading} className="btn btn-gold" style={{ marginTop: 4 }}>
              {loading ? <span className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(15,10,5,0.3)', borderTopColor: '#0f0a05', borderRadius: '50%', display: 'inline-block' }} /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontWeight: 600 }}>
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
