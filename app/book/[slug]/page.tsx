import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BookDetailClient } from './BookDetailClient'

export const dynamic = 'force-dynamic'

export default async function BookPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!book) notFound()

  const { data: chapters = [] } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', book.id)
    .order('order_index')

  const { data: { user } } = await supabase.auth.getUser()

  let userLibrary = null
  let userProgress = null
  let reviews: any[] = []

  if (user) {
    const [lib, prog, rev] = await Promise.all([
      supabase.from('user_library').select('*').eq('user_id', user.id).eq('book_id', book.id).single(),
      supabase.from('user_progress').select('*, chapters(title,order_index)').eq('user_id', user.id).eq('book_id', book.id).single(),
      supabase.from('reviews').select('*, profile:profiles(display_name)').eq('book_id', book.id).order('created_at', { ascending: false }),
    ])
    userLibrary = lib.data
    userProgress = prog.data
    reviews = rev.data ?? []
  } else {
    const { data } = await supabase.from('reviews').select('*, profile:profiles(display_name)').eq('book_id', book.id).order('created_at', { ascending: false })
    reviews = data ?? []
  }

  return <BookDetailClient book={book} chapters={chapters ?? []} userLibrary={userLibrary} userProgress={userProgress} reviews={reviews} userId={user?.id ?? null} />
}
