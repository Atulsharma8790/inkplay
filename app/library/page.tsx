import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookCard } from '@/components/book/BookCard'
import { Library } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TABS = [
  { key: 'in_progress', label: 'In Progress' },
  { key: 'wishlist',    label: 'Wishlist' },
  { key: 'completed',  label: 'Completed' },
]

export default async function LibraryPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tab = searchParams.tab ?? 'in_progress'

  const { data: itemsRaw } = await supabase
    .from('user_library')
    .select('*, book:books(*), progress:user_progress(position_sec, chapter_id, chapters(order_index))')
    .eq('user_id', user.id)
    .eq('status', tab)
    .order('added_at', { ascending: false })
  const items = itemsRaw ?? []

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: 32, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Library size={28} color="var(--gold)" /> My Library
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your personal audiobook collection</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28, padding: 4, background: 'var(--bg-card)', borderRadius: 12, width: 'fit-content', border: '1px solid var(--border)' }}>
        {TABS.map(({ key, label }) => (
          <a key={key} href={`/library?tab=${key}`} style={{
            padding: '7px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500,
            textDecoration: 'none', transition: 'all .2s',
            background: tab === key ? 'linear-gradient(135deg,#c9a84c,#a07830)' : 'transparent',
            color: tab === key ? '#0f0a05' : 'var(--text-muted)',
          }}>{label}</a>
        ))}
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📚</p>
          <p style={{ fontSize: 16, marginBottom: 8 }}>Nothing here yet</p>
          <a href="/discover" className="btn btn-gold" style={{ fontSize: 13 }}>Browse Library</a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
          {items.map((item: any) => item.book && (
            <BookCard key={item.id} book={item.book} progress={
              tab === 'in_progress' && item.progress?.[0]
                ? Math.round((item.progress[0].position_sec / item.book.total_duration_sec) * 100)
                : tab === 'completed' ? 100 : undefined
            } />
          ))}
        </div>
      )}
    </div>
  )
}
