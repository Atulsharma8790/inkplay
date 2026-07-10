'use client'
import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'
import type { Book, Chapter } from '@/types'

interface PlayerCtx {
  book: Book | null
  chapter: Chapter | null
  chapters: Chapter[]
  isPlaying: boolean
  currentTime: number
  duration: number
  speed: number
  volume: number
  loadBook: (book: Book, chapters: Chapter[], startChapterIdx?: number, startSec?: number) => void
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (sec: number) => void
  setSpeed: (s: number) => void
  setVolume: (v: number) => void
  nextChapter: () => void
  prevChapter: () => void
}

const Ctx = createContext<PlayerCtx>({} as PlayerCtx)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapterIdx, setChapterIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeedState] = useState(1)
  const [volume, setVolumeState] = useState(1)

  const chapter = chapters[chapterIdx] ?? null

  // Init audio element once
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime))
    audio.addEventListener('durationchange', () => setDuration(audio.duration))
    audio.addEventListener('ended', () => {
      setChapterIdx(prev => {
        const next = prev + 1
        if (next < chapters.length) { loadChapterIdx(next, 0); return next }
        setIsPlaying(false); return prev
      })
    })
    audio.addEventListener('play',  () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))

    return () => { audio.pause(); audio.src = '' }
  }, [])

  // Re-wire when chapters change
  useEffect(() => {
    if (!audioRef.current || chapters.length === 0) return
    const audio = audioRef.current
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [chapters])

  function onEnded() {
    setChapterIdx(prev => {
      const next = prev + 1
      if (next < chapters.length) { loadChapterIdx(next, 0); return next }
      setIsPlaying(false); return prev
    })
  }

  function loadChapterIdx(idx: number, startSec = 0) {
    const ch = chapters[idx]
    if (!ch || !audioRef.current) return
    const url = `/api/stream?chapterId=${ch.id}`
    audioRef.current.src = url
    audioRef.current.currentTime = startSec
    audioRef.current.play().catch(() => {})
    updateMediaSession(ch)
  }

  function updateMediaSession(ch: Chapter) {
    if (!('mediaSession' in navigator) || !book) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: ch.title,
      artist: book.author,
      album: book.title,
      artwork: book.cover_url ? [{ src: book.cover_url, sizes: '512x512', type: 'image/jpeg' }] : [],
    })
    navigator.mediaSession.setActionHandler('play',             () => audioRef.current?.play())
    navigator.mediaSession.setActionHandler('pause',            () => audioRef.current?.pause())
    navigator.mediaSession.setActionHandler('nexttrack',        () => nextChapter())
    navigator.mediaSession.setActionHandler('previoustrack',    () => prevChapter())
    navigator.mediaSession.setActionHandler('seekbackward',     () => seek(Math.max(0, (audioRef.current?.currentTime ?? 0) - 10)))
    navigator.mediaSession.setActionHandler('seekforward',      () => seek((audioRef.current?.currentTime ?? 0) + 30))
  }

  const loadBook = useCallback((b: Book, chs: Chapter[], startChIdx = 0, startSec = 0) => {
    setBook(b); setChapters(chs); setChapterIdx(startChIdx)
    if (!audioRef.current) return
    audioRef.current.src = `/api/stream?chapterId=${chs[startChIdx].id}`
    audioRef.current.currentTime = startSec
    audioRef.current.playbackRate = speed
    audioRef.current.volume = volume
    audioRef.current.play().catch(() => {})
    updateMediaSession(chs[startChIdx])
  }, [speed, volume])

  const play  = useCallback(() => audioRef.current?.play(),  [])
  const pause = useCallback(() => audioRef.current?.pause(), [])
  const toggle = useCallback(() => { isPlaying ? pause() : play() }, [isPlaying])
  const seek  = useCallback((s: number) => { if (audioRef.current) audioRef.current.currentTime = s }, [])

  const setSpeed = useCallback((s: number) => {
    setSpeedState(s)
    if (audioRef.current) audioRef.current.playbackRate = s
  }, [])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
    if (audioRef.current) audioRef.current.volume = v
  }, [])

  const nextChapter = useCallback(() => {
    const next = chapterIdx + 1
    if (next < chapters.length) { setChapterIdx(next); loadChapterIdx(next, 0) }
  }, [chapterIdx, chapters])

  const prevChapter = useCallback(() => {
    if (currentTime > 3) { seek(0); return }
    const prev = chapterIdx - 1
    if (prev >= 0) { setChapterIdx(prev); loadChapterIdx(prev, 0) }
  }, [chapterIdx, currentTime])

  return (
    <Ctx.Provider value={{ book, chapter, chapters, isPlaying, currentTime, duration, speed, volume, loadBook, play, pause, toggle, seek, setSpeed, setVolume, nextChapter, prevChapter }}>
      {children}
    </Ctx.Provider>
  )
}

export const usePlayer = () => useContext(Ctx)
