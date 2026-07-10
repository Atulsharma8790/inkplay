'use client'
import { usePlayer } from '@/lib/PlayerContext'
import { Play, Pause, SkipBack, SkipForward, Volume2, BookOpen } from 'lucide-react'
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
      background: 'rgba(26,19,10,0.97)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
    }}>
      {/* Progress track at very top */}
      <div ref={trackRef} onClick={onTrackClick}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, cursor: 'pointer', background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#c9a84c,#d97706)', transition: 'width .1s linear' }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Book cover + info */}
        <Link href={`/book/${book.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
            background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border)',
          }}>
            {book.cover_url
              ? <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <BookOpen size={20} color="var(--gold-dim)" />
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{book.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{chapter.title}</div>
          </div>
        </Link>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}>
          <button onClick={prevChapter} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}>
            <SkipBack size={18} />
          </button>
          <button onClick={toggle} style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg,#c9a84c,#a07830)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {isPlaying ? <Pause size={18} fill="#0f0a05" color="#0f0a05" /> : <Play size={18} fill="#0f0a05" color="#0f0a05" style={{ marginLeft: 2 }} />}
          </button>
          <button onClick={nextChapter} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}>
            <SkipForward size={18} />
          </button>
        </div>

        {/* Time */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(currentTime)} / {fmt(duration)}
        </div>

        {/* Speed */}
        <button onClick={() => setSpeed(nextSpeed)} style={{
          background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700,
          color: 'var(--gold)', cursor: 'pointer', flexShrink: 0,
        }}>
          {speed}×
        </button>
      </div>
    </div>
  )
}
