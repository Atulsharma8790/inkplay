'use client'
import { useState } from 'react'
import { usePlayer } from '@/lib/PlayerContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Book, Chapter, UserLibrary, UserProgress, Review } from '@/types'
import { Play, Bookmark, BookOpen, Clock, Star, Share2, Heart, RotateCcw, List, ChevronDown, ChevronUp } from 'lucide-react'

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
function fmtTime(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

interface Props {
  book: Book
  chapters: Chapter[]
  userLibrary: UserLibrary | null
  userProgress: UserProgress | null
  reviews: Review[]
  userId: string | null
}

export function BookDetailClient({ book, chapters, userLibrary, userProgress, reviews, userId }: Props) {
  const { loadBook } = usePlayer()
  const router = useRouter()
  const supabase = createClient()
  const [libStatus, setLibStatus] = useState(userLibrary?.status ?? null)
  const [saving, setSaving] = useState(false)
  const [showAllChapters, setShowAllChapters] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewBody, setReviewBody] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews)

  const hasProgress = !!userProgress
  const progressPct = hasProgress && book.total_duration_sec > 0
    ? Math.round((userProgress.position_sec / book.total_duration_sec) * 100)
    : 0
  const avgRating = localReviews.length > 0
    ? localReviews.reduce((a, r) => a + r.rating, 0) / localReviews.length
    : null

  function play(fromBeginning = false) {
    if (!userId) { router.push('/login'); return }
    let startIdx = 0, startSec = 0
    if (!fromBeginning && userProgress) {
      startIdx = chapters.findIndex(c => c.id === userProgress.chapter_id)
      if (startIdx < 0) startIdx = 0
      startSec = userProgress.position_sec
    }
    loadBook(book, chapters, startIdx, startSec)
  }

  async function toggleWishlist() {
    if (!userId) { router.push('/login'); return }
    setSaving(true)
    if (libStatus) {
      await supabase.from('user_library').delete().eq('user_id', userId).eq('book_id', book.id)
      setLibStatus(null)
    } else {
      await supabase.from('user_library').insert({ user_id: userId, book_id: book.id, status: 'wishlist' })
      setLibStatus('wishlist')
    }
    setSaving(false)
  }

  async function submitReview() {
    if (!userId || rating === 0) return
    setSubmittingReview(true)
    const { data } = await supabase.from('reviews').upsert({
      user_id: userId, book_id: book.id, rating, body: reviewBody || null,
    }, { onConflict: 'user_id,book_id' }).select('*, profile:profiles(display_name)').single()
    if (data) setLocalReviews(prev => [data, ...prev.filter(r => r.user_id !== userId)])
    setSubmittingReview(false)
  }

  function shareBook() {
    const url = `${window.location.origin}/book/${book.slug}`
    if (navigator.share) {
      navigator.share({ title: book.title, text: `Listen to "${book.title}" on InkPlay`, url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied!')
    }
  }

  const displayedChapters = showAllChapters ? chapters : chapters.slice(0, 6)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 40, alignItems: 'start' }}>

        {/* Left: Cover + actions */}
        <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 20px)' }}>
          <div style={{ aspectRatio: '2/3', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {book.cover_url
              ? <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={48} color="var(--gold-dim)" /></div>
            }
          </div>

          {/* Progress bar */}
          {hasProgress && progressPct > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>Progress</span><span>{progressPct}%</span>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>
            </div>
          )}

          {/* Play buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => play(false)} className="btn btn-gold" style={{ width: '100%', fontSize: 15, padding: '13px' }}>
              <Play size={17} fill="#0f0a05" />
              {hasProgress && progressPct > 0 ? 'Continue Listening' : 'Play Now'}
            </button>
            {hasProgress && progressPct > 0 && (
              <button onClick={() => play(true)} className="btn btn-ghost" style={{ width: '100%', fontSize: 13 }}>
                <RotateCcw size={14} /> Start from Beginning
              </button>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={toggleWishlist} disabled={saving} className="btn btn-ghost" style={{ flex: 1, fontSize: 13 }}>
                <Heart size={14} fill={libStatus ? 'var(--gold)' : 'none'} color={libStatus ? 'var(--gold)' : 'currentColor'} />
                {libStatus ? 'In Library' : 'Add to Library'}
              </button>
              <button onClick={shareBook} className="btn btn-ghost" style={{ padding: '10px 14px' }}>
                <Share2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div>
          {/* Genres */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {book.genre.map(g => <span key={g} className="badge badge-gold">{g}</span>)}
            {book.status === 'hidden' && <span className="badge badge-red">Hidden</span>}
          </div>

          <h1 style={{ fontSize: 'clamp(24px,4vw,42px)', lineHeight: 1.1, marginBottom: 8 }}>{book.title}</h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 4 }}>by <strong style={{ color: 'var(--text)' }}>{book.author}</strong></p>
          {book.narrator && <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>Narrated by {book.narrator}</p>}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              <Clock size={14} color="var(--gold)" /> {fmt(book.total_duration_sec)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              <List size={14} color="var(--gold)" /> {book.chapter_count} chapters
            </div>
            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                <Star size={14} color="var(--gold)" fill="var(--gold)" /> {avgRating.toFixed(1)} ({localReviews.length} reviews)
              </div>
            )}
            {book.year && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{book.year}</span>}
            {book.language && <span className="badge badge-muted">{book.language}</span>}
          </div>

          {/* Description */}
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 24 }}>{book.description}</p>

          {book.summary && (
            <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>AI Summary</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{book.summary}</p>
            </div>
          )}

          {/* Chapters */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 14 }}>Chapters</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {displayedChapters.map((ch, i) => {
                const isActive = userProgress?.chapter_id === ch.id
                return (
                  <div key={ch.id} onClick={() => { if (userId) { loadBook(book, chapters, i, isActive ? userProgress!.position_sec : 0) } else router.push('/login') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', transition: 'background .15s',
                      background: isActive ? 'rgba(201,168,76,0.08)' : 'var(--bg-card)',
                      border: `1px solid ${isActive ? 'rgba(201,168,76,0.25)' : 'var(--border)'}`,
                    }}>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', width: 20, textAlign: 'center', flexShrink: 0 }}>{ch.order_index + 1}</span>
                    <span style={{ flex: 1, fontSize: 13, color: isActive ? 'var(--gold)' : 'var(--text)' }}>{ch.title}</span>
                    {isActive && <span style={{ fontSize: 10, color: 'var(--gold)' }}>▶ {fmtTime(userProgress!.position_sec)}</span>}
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>{fmt(ch.duration_sec)}</span>
                  </div>
                )
              })}
            </div>
            {chapters.length > 6 && (
              <button onClick={() => setShowAllChapters(p => !p)} className="btn btn-ghost" style={{ marginTop: 10, width: '100%', fontSize: 13 }}>
                {showAllChapters ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {chapters.length} chapters</>}
              </button>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 14 }}>Reviews</h2>

            {/* Write review */}
            {userId && (
              <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Your rating</p>
                <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                      <Star size={22} color="var(--gold)" fill={n <= rating ? 'var(--gold)' : 'none'} />
                    </button>
                  ))}
                </div>
                <textarea className="input" rows={3} placeholder="Share your thoughts (optional)…" value={reviewBody} onChange={e => setReviewBody(e.target.value)} style={{ marginBottom: 10 }} />
                <button onClick={submitReview} disabled={rating === 0 || submittingReview} className="btn btn-gold" style={{ fontSize: 13 }}>
                  {submittingReview ? 'Saving…' : 'Submit Review'}
                </button>
              </div>
            )}

            {localReviews.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No reviews yet. Be the first!</p>
              : localReviews.map(r => (
                <div key={r.id} className="card" style={{ padding: '14px 18px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.profile?.display_name ?? 'Anonymous'}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(n => <Star key={n} size={12} color="var(--gold)" fill={n <= r.rating ? 'var(--gold)' : 'none'} />)}
                    </div>
                  </div>
                  {r.body && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{r.body}</p>}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
