import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  // Must be authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = req.nextUrl.searchParams.get('chapterId')
  if (!chapterId) return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 })

  // Fetch chapter + book — RLS ensures visibility rules are enforced
  const { data: chapter, error } = await supabase
    .from('chapters')
    .select('audio_path, book_id, books(status, title)')
    .eq('id', chapterId)
    .single()

  if (error || !chapter) return NextResponse.json({ error: 'Chapter not found or access denied' }, { status: 404 })

  // Generate short-lived signed URL (60s) from private storage bucket
  const { data: signed, error: signErr } = await supabase
    .storage
    .from('audiobooks')
    .createSignedUrl(chapter.audio_path, 60)

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate stream' }, { status: 500 })
  }

  // Proxy the audio — never expose the signed URL to the client
  const rangeHeader = req.headers.get('range') ?? undefined
  const upstream = await fetch(signed.signedUrl, {
    headers: rangeHeader ? { Range: rangeHeader } : {},
  })

  const status = upstream.status === 206 ? 206 : 200
  const headers = new Headers({
    'Content-Type':        upstream.headers.get('Content-Type') ?? 'audio/mpeg',
    'Content-Disposition': 'inline',           // prevents download
    'Accept-Ranges':       'bytes',
    'Cache-Control':       'no-store',
    'X-Content-Options':   'nosniff',
  })

  if (upstream.headers.get('Content-Length')) headers.set('Content-Length', upstream.headers.get('Content-Length')!)
  if (upstream.headers.get('Content-Range'))  headers.set('Content-Range',  upstream.headers.get('Content-Range')!)

  return new NextResponse(upstream.body, { status, headers })
}
