import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookId, chapterId, positionSec, completed } = await req.json()
  if (!bookId || !chapterId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Upsert progress
  const { error: progressErr } = await supabase.from('user_progress').upsert({
    user_id:       user.id,
    book_id:       bookId,
    chapter_id:    chapterId,
    position_sec:  Math.floor(positionSec),
    completed:     !!completed,
    last_played_at: new Date().toISOString(),
  }, { onConflict: 'user_id,book_id' })

  if (progressErr) return NextResponse.json({ error: progressErr.message }, { status: 500 })

  // Update library status to in_progress if it was wishlist
  await supabase.from('user_library')
    .update({ status: completed ? 'completed' : 'in_progress' })
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .eq('status', completed ? 'in_progress' : 'wishlist')

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookId = req.nextUrl.searchParams.get('bookId')
  if (!bookId) return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })

  const { data } = await supabase
    .from('user_progress')
    .select('*, chapters(title, order_index)')
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .single()

  return NextResponse.json({ progress: data ?? null })
}
