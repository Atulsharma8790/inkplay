'use client'
import Link from 'next/link'
import { Play, BookOpen, Clock } from 'lucide-react'
import type { Book } from '@/types'

function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function BookCard({ book, progress }: { book: Book; progress?: number }) {
  return (
    <Link href={`/book/${book.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, border-color .2s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>

        {/* Cover */}
        <div style={{ aspectRatio: '2/3', background: 'var(--bg-elevated)', position: 'relative', overflow: 'hidden' }}>
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 }}>
              <BookOpen size={32} color="var(--gold-dim)" />
              <span style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', fontFamily: 'Georgia,serif' }}>{book.title}</span>
            </div>
          )}
          {/* Progress bar overlay */}
          {progress !== undefined && progress > 0 && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.4)' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#c9a84c,#d97706)' }} />
            </div>
          )}
          {/* Play overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s', opacity: 0 }}
            className="play-overlay">
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(201,168,76,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={18} fill="#0f0a05" color="#0f0a05" style={{ marginLeft: 2 }} />
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px 14px' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
            {book.genre.slice(0, 2).map(g => (
              <span key={g} className="badge badge-muted" style={{ fontSize: 9 }}>{g}</span>
            ))}
          </div>
          <h3 style={{ fontSize: 13, fontFamily: 'Georgia,serif', color: 'var(--text)', lineHeight: 1.3, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {book.title}
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{book.author}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)', fontSize: 10 }}>
            <Clock size={10} />
            {fmtDuration(book.total_duration_sec)}
          </div>
        </div>
      </div>
    </Link>
  )
}
