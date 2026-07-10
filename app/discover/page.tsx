import { createClient } from '@/lib/supabase/server'
import { BookCard } from '@/components/book/BookCard'
import { Search } from 'lucide-react'
import type { Book } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DiscoverPage({ searchParams }: { searchParams: { q?: string; genre?: string } }) {
  const supabase = await createClient()
  const q = searchParams.q?.trim() ?? ''
  const genre = searchParams.genre ?? ''

  let query = supabase.from('books').select('*').eq('status', 'published').order('created_at', { ascending: false })
  if (q)     query = query.ilike('title', `%${q}%`)
  if (genre) query = query.contains('genre', [genre])

  const { data: booksRaw } = await query
  const books: Book[] = (booksRaw ?? []) as Book[]

  const genres = ['Fiction', 'Non-Fiction', 'Self-Help', 'Thriller', 'Biography', 'Science', 'History', 'Fantasy']

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: 32, marginBottom: 6 }}>Discover</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Find your next great listen</p>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <form method="get" style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input name="q" defaultValue={q} placeholder="Search by title or author…" className="input" style={{ paddingLeft: 36 }} />
          {genre && <input type="hidden" name="genre" value={genre} />}
        </form>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {genres.map(g => (
            <a key={g} href={`/discover?genre=${g === genre ? '' : g}`} className="badge" style={{
              padding: '6px 12px', fontSize: 12, cursor: 'pointer', textDecoration: 'none',
              background: g === genre ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
              color: g === genre ? 'var(--gold)' : 'var(--text-muted)',
              border: `1px solid ${g === genre ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>{g}</a>
          ))}
        </div>
      </div>

      {/* Grid */}
      {books.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📚</p>
          <p>No books found{q ? ` for "${q}"` : ''}.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
          {books.map(book => <BookCard key={book.id} book={book} />)}
        </div>
      )}
    </div>
  )
}
