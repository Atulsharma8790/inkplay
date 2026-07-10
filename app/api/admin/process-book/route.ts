import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { bookId } = await req.json()
  if (!bookId) return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })

  // Use service role to update (bypasses RLS for admin operations)
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: chapters } = await adminSupabase
    .from('chapters')
    .select('*')
    .eq('book_id', bookId)
    .order('order_index')

  // Update book to published status with chapter count
  await adminSupabase.from('books').update({
    status: 'draft', // stays draft until admin manually publishes
    chapter_count: chapters?.length ?? 0,
  }).eq('id', bookId)

  return NextResponse.json({ ok: true })
}
