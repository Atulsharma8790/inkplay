import Link from 'next/link'
import { Headphones, Shield, Zap, BookOpen } from 'lucide-react'

const FEATURES = [
  { icon: Headphones, title: 'Stream Instantly',   desc: 'No downloads. No waiting. Press play and listen immediately.', color: '#8b5cf6' },
  { icon: Shield,     title: 'Always Free',         desc: 'Every audiobook, every chapter — completely free to stream.', color: '#f59e0b' },
  { icon: Zap,        title: 'Pick Up Anywhere',    desc: 'Your progress syncs across devices. Resume exactly where you left off.', color: '#10b981' },
  { icon: BookOpen,   title: 'Curated Library',     desc: 'Hand-picked titles across fiction, non-fiction, self-help, and more.', color: '#a78bfa' },
]

export default function HomePage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 0 72px', position: 'relative' }}>
        {/* Glow blob behind hero text */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="badge badge-violet" style={{ marginBottom: 24, fontSize: 11, padding: '5px 14px' }}>
            ✦ Free · Stream-only · No downloads
          </span>

          <h1 style={{ fontSize: 'clamp(40px,7vw,80px)', lineHeight: 1.06, marginBottom: 22 }}>
            Listen to stories<br />
            <span style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>that move you</span>
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.65 }}>
            Your personal audiobook library. Stream anything, track your progress, and pick up exactly where you left off — on any device.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/discover" className="btn btn-gold" style={{ fontSize: 15, padding: '13px 30px' }}>
              Browse Library →
            </Link>
            <Link href="/login" className="btn btn-ghost" style={{ fontSize: 15, padding: '13px 30px' }}>
              Sign in free
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginBottom: 100 }}>
        {FEATURES.map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="card" style={{ padding: '24px 22px', position: 'relative', overflow: 'hidden' }}>
            {/* subtle color glow in card corner */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon size={20} color={color} />
            </div>
            <h3 style={{ fontSize: 15, marginBottom: 8, background: 'none', WebkitTextFillColor: 'var(--text)', color: 'var(--text)' }}>{title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>{desc}</p>
          </div>
        ))}
      </section>

    </div>
  )
}
