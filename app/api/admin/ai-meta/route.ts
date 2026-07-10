import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, author, description } = await req.json()
  if (!title || !description) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const msg = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are helping catalog an audiobook for a streaming platform.

Book: "${title}"
Author: ${author ?? 'Unknown'}
Description: ${description}

Generate a JSON response with exactly these fields:
- "tagline": A compelling one-sentence hook for the book (max 12 words)
- "summary": A 2-3 sentence AI-generated summary suitable for listeners (focus on themes, tone, why someone would love it)
- "chapterTitles": An array of 1-12 plausible chapter title suggestions based on the description

Respond ONLY with valid JSON, no prose before or after.`,
    }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'AI parse error', raw: text }, { status: 500 })
  }
}
