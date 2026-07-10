import Link from 'next/link'
import { BookOpen, Headphones, Shield, Zap } from 'lucide-react'

const FEATURES = [
  { icon: Headphones, title: 'Stream Instantly',     desc: 'No downloads. No waiting. Press play and listen immediately.' },
  { icon: Shield,     title: 'Always Free',           desc: 'Every audiobook, every chapter — completely free to stream.' },
  { icon: Zap,        title: 'Pick Up Anywhere',      desc: 'Your progress syncs across devices. Resume exactly where you left off.' },
  { icon: BookOpen,   title: 'Curated Library',       desc: 'Hand-picked titles across fiction, non-fiction, self-help, and more.' },
]

export default function HomePage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 0 60px' }}>
        <div className="badge badge-gold" style={{ marginBottom: 24, fontSize: 11 }}>
          ✦ Free · Stream-only · No downloads
        </div>
        <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', lineHeight: 1.08, color: 'var(--text)', marginBottom: 20 }}>
          Your personal<br />
          <span style={{ color: 'var(--gold)' }}>audiobook library</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.6 }}>
          Stream thousands of audiobooks free. Track progress, build your wishlist, and listen on any device — no downloads ever.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/discover" className="btn btn-gold" style={{ fontSize: 15, padding: '12px 28px' }}>
            Browse Library
          </Link>
          <Link href="/login" className="btn btn-ghost" style={{ fontSize: 15, padding: '12px 28px' }}>
            Sign in free
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16, marginBottom: 80 }}>
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card" style={{ padding: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon size={20} color="var(--gold)" />
            </div>
            <h3 style={{ fontSize: 15, fontFamily: 'Georgia,serif', color: 'var(--text)', marginBottom: 6 }}>{title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </section>

    </div>
  )
}
