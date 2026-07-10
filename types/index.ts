export type BookStatus = 'draft' | 'published' | 'hidden' | 'archived'
export type LibraryStatus = 'wishlist' | 'in_progress' | 'completed'

export interface Book {
  id: string
  slug: string
  title: string
  author: string
  narrator?: string
  description: string
  summary?: string
  tagline?: string
  cover_url?: string
  genre: string[]
  language: string
  year?: number
  isbn?: string
  total_duration_sec: number
  chapter_count: number
  status: BookStatus
  content_warnings?: string[]
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  book_id: string
  title: string
  order_index: number
  start_sec: number
  end_sec: number
  duration_sec: number
  audio_path: string
  transcript?: string
}

export interface UserProgress {
  id: string
  user_id: string
  book_id: string
  chapter_id: string
  position_sec: number
  completed: boolean
  last_played_at: string
}

export interface UserLibrary {
  id: string
  user_id: string
  book_id: string
  status: LibraryStatus
  added_at: string
  book?: Book
}

export interface Bookmark {
  id: string
  user_id: string
  book_id: string
  chapter_id: string
  position_sec: number
  note?: string
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  book_id: string
  rating: number
  body?: string
  created_at: string
  profile?: { display_name: string; avatar_url?: string }
}

export interface Profile {
  id: string
  display_name: string
  avatar_url?: string
  is_admin: boolean
  playback_speed: number
  created_at: string
}

export interface PlayerState {
  bookId: string
  chapterId: string
  positionSec: number
  isPlaying: boolean
  speed: number
  volume: number
  duration: number
}
