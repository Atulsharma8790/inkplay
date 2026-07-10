'use client'
import { usePlayer } from '@/lib/PlayerContext'
import { Play, Pause, SkipBack, SkipForward, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2]

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60)
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`
}

export function PlayerBar() {
  const { book, chapter, isPlaying, currentTime, duration, speed, toggle, seek, setSpeed, nextChapter, prevChapter } = usePlayer()
  const trackRef = useRef<HTMLDivElement>(null)

  if (!book || !chapter) return null

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  function onTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || !duration) return
    seek(((e.clientX - rect.left) / rect.width) * duration)
  }

  const speedIdx = SPEEDS.indexOf(speed)
  const nextSpeed = SPEEDS[(speedIdx + 1) % SPEEDS.length]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      height: 'var(--player-h)',
      background: 'rgba(8,10,22,0.97)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(139,92,246,0.2)',
      boxShadow: '0 -8px 40px rgba(124,58,237,0.15)',
    }}>
      {/* Progress track — glowing violet */}
      <div ref={trackRef} onClick={onTrackClick}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#7c3aed,#a78bfa,#f59e0b)', transition: 'width .1s linear', boxShadow: '0 0 8px rgba(139,92,246,0.6)' }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Book info */}
        <Link href={`/book/${book.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
            background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(139,92,246,0.2)',
            boxShadow: isPlaying ? '0 0 12px rgba(139,92,246,0.4)' : 'none',
            transition: 'box-shadow .3s',
          }}>
            {book.cover_url
              ? <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <BookOpen size={20} color="var(--violet)" />
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{book.title}</div>
            <div style={{ fontSize: 11, color: 'var(--violet-light)', marginTop: 1, opacity: 0.7 }}>{chapter.title}</div>
          </div>
        </Link>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 auto' }}>
          <button onClick={prevChapter} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, transition: 'color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--violet-light)') }
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <SkipBack size={18} />
          </button>

          <button onClick={toggle} style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isPlaying ? '0 0 20px rgba(124,58,237,0.7)' : '0 4px 16px rgba(124,58,237,0.35)',
            transition: 'box-shadow .2s, transform .1s',
          }}>
            {isPlaying
              ? <Pause size={18} fill="#fff" color="#fff" />
              : <Play size={18} fill="#fff" color="#fff" style={{ marginLeft: 2 }} />
            }
          </button>

          <button onClick={nextChapter} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, transition: 'color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--violet-light)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <SkipForward size={18} />
          </button>
        </div>

        {/* Time */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.03em' }}>
          {fmt(currentTime)} / {fmt(duration)}
        </div>

        {/* Speed */}
        <button onClick={() => setSpeed(nextSpeed)} style={{
          background: 'rgba(139,92,246,0.1)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700,
          color: 'var(--violet-light)', cursor: 'pointer', flexShrink: 0,
          transition: 'all .15s',
        }}>
          {speed}×
        </button>
      </div>
    </div>
  )
}
