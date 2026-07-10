'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { Upload, BookOpen, Eye, EyeOff, Sparkles, Trash2, Plus, BarChart3 } from 'lucide-react'
import type { Book } from '@/types'

const GENRES = ['Fiction','Non-Fiction','Self-Help','Thriller','Biography','Science','History','Fantasy','Mystery','Romance','Business','Philosophy']

export default function AdminPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'books'|'upload'>('books')
  const [books, setBooks] = useState<Book[]>([])
  const [loadingBooks, setLoadingBooks] = useState(true)

  // Upload form state
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [narrator, setNarrator] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState<string[]>([])
  const [year, setYear] = useState('')
  const [language, setLanguage] = useState('English')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [generatedMeta, setGeneratedMeta] = useState<{summary:string; tagline:string; chapterTitles:string[]} | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!profile || !profile.is_admin)) router.push('/')
  }, [profile, loading])

  useEffect(() => { if (profile?.is_admin) fetchBooks() }, [profile])

  async function fetchBooks() {
    setLoadingBooks(true)
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false })
    setBooks((data ?? []) as Book[])
    setLoadingBooks(false)
  }

  async function generateAIMeta() {
    if (!title || !description) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/admin/ai-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, description }),
      })
      const data = await res.json()
      if (data.summary) setGeneratedMeta(data)
    } finally { setAiLoading(false) }
  }

  async function toggleVisibility(book: Book) {
    setTogglingId(book.id)
    const newStatus = book.status === 'published' ? 'hidden' : 'published'
    await supabase.from('books').update({ status: newStatus, hidden_at: newStatus === 'hidden' ? new Date().toISOString() : null }).eq('id', book.id)

    // If hiding: remove from wishlist/completed users but keep in_progress
    if (newStatus === 'hidden') {
      await supabase.from('user_library').delete()
        .eq('book_id', book.id)
        .in('status', ['wishlist', 'completed'])
    }

    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: newStatus } : b))
    setTogglingId(null)
  }

  async function deleteBook(id: string) {
    if (!confirm('Delete this book permanently? This cannot be undone.')) return
    await supabase.from('books').delete().eq('id', id)
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  async function uploadBook(e: React.FormEvent) {
    e.preventDefault()
    if (!audioFile || !title || !author) return
    setUploading(true)

    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setUploadProgress('Uploading audio file…')

      // Upload audio to private bucket
      const audioPath = `${slug}/${Date.now()}-${audioFile.name}`
      const { error: audioErr } = await supabase.storage.from('audiobooks').upload(audioPath, audioFile)
      if (audioErr) { alert('Audio upload failed: ' + audioErr.message); return }

      let coverUrl = ''
      if (coverFile) {
        setUploadProgress('Uploading cover image…')
        const coverPath = `covers/${slug}-${Date.now()}.jpg`
        const { data: coverData } = await supabase.storage.from('audiobooks').upload(coverPath, coverFile, { upsert: true })
        if (coverData) {
          const { data: { publicUrl } } = supabase.storage.from('audiobooks').getPublicUrl(coverPath)
          coverUrl = publicUrl
        }
      }

      setUploadProgress('Creating book record…')
      const { data: bookData, error: bookErr } = await supabase.from('books').insert({
        slug,
        title,
        author,
        narrator: narrator || null,
        description,
        summary: generatedMeta?.summary ?? null,
        tagline: generatedMeta?.tagline ?? null,
        cover_url: coverUrl || null,
        genre,
        language,
        year: year ? parseInt(year) : null,
        status: 'draft',
        total_duration_sec: 0,
        chapter_count: 0,
      }).select().single()

      if (bookErr || !bookData) { alert('Book creation failed: ' + bookErr?.message); return }

      // Create single chapter from full audio
      setUploadProgress('Setting up chapter…')
      await supabase.from('chapters').insert({
        book_id: bookData.id,
        title: generatedMeta?.chapterTitles?.[0] ?? 'Full Book',
        order_index: 0,
        start_sec: 0,
        end_sec: 3600, // placeholder — real duration set after AI processing
        audio_path: audioPath,
      })

      // Trigger AI metadata + duration extraction
      setUploadProgress('Running AI analysis…')
      await fetch('/api/admin/process-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: bookData.id, audioPath, chapterTitles: generatedMeta?.chapterTitles }),
      })

      setUploadProgress('Done!')
      setTimeout(() => {
        setTab('books'); fetchBooks()
        setTitle(''); setAuthor(''); setNarrator(''); setDescription(''); setGenre([]); setAudioFile(null); setCoverFile(null); setGeneratedMeta(null); setUploadProgress('')
      }, 1000)

    } finally { setUploading(false) }
  }

  if (loading || !profile?.is_admin) return null

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={20} color="var(--amber)" />
        </div>
        <div>
          <h1 style={{ fontSize: 24 }}>Admin Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage your audiobook library</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28, padding: 4, background: 'var(--bg-card)', borderRadius: 12, width: 'fit-content', border: '1px solid var(--border)' }}>
        {[{id:'books',label:'All Books',icon:BookOpen},{id:'upload',label:'Upload New',icon:Upload}].map(({id,label,icon:Icon}) => (
          <button key={id} onClick={() => setTab(id as any)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, fontSize:13, fontWeight:500, border:'none', cursor:'pointer', transition:'all .2s',
            background: tab===id ? 'linear-gradient(135deg,#d97706,#b45309)' : 'transparent',
            color: tab===id ? '#0f0a05' : 'var(--text-muted)',
          }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Books List */}
      {tab === 'books' && (
        <div>
          {loadingBooks ? (
            <div style={{ display:'grid', gap:10 }}>
              {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height:76 }} />)}
            </div>
          ) : books.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text-muted)' }}>
              <p style={{ fontSize:40, marginBottom:12 }}>📚</p>
              <p style={{ marginBottom:16 }}>No books yet. Upload your first audiobook!</p>
              <button onClick={() => setTab('upload')} className="btn btn-gold"><Plus size={14} /> Upload Book</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {books.map(book => (
                <div key={book.id} className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:42, height:56, borderRadius:6, overflow:'hidden', flexShrink:0, background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border)' }}>
                    {book.cover_url ? <img src={book.cover_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <BookOpen size={16} color="var(--gold-dim)" />}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <p style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{book.title}</p>
                      <span className={`badge ${book.status === 'published' ? 'badge-green' : book.status === 'hidden' ? 'badge-red' : 'badge-muted'}`}>{book.status}</span>
                    </div>
                    <p style={{ fontSize:12, color:'var(--text-muted)' }}>{book.author} · {book.genre.join(', ')}</p>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <button onClick={() => toggleVisibility(book)} disabled={togglingId === book.id || book.status === 'draft'} className="btn btn-ghost" style={{ fontSize:12, padding:'6px 12px', gap:5 }}>
                      {book.status === 'published' ? <><EyeOff size={13} /> Hide</> : book.status === 'hidden' ? <><Eye size={13} /> Publish</> : <><Eye size={13} /> Publish</>}
                    </button>
                    <button onClick={() => deleteBook(book.id)} className="btn btn-danger" style={{ fontSize:12, padding:'6px 12px' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Form */}
      {tab === 'upload' && (
        <form onSubmit={uploadBook} style={{ maxWidth:680 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div><label className="label">Title *</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Book title" required /></div>
            <div><label className="label">Author *</label><input className="input" value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Author name" required /></div>
            <div><label className="label">Narrator</label><input className="input" value={narrator} onChange={e=>setNarrator(e.target.value)} placeholder="Narrator name" /></div>
            <div><label className="label">Year</label><input className="input" type="number" value={year} onChange={e=>setYear(e.target.value)} placeholder="2024" /></div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label className="label">Description *</label>
            <textarea className="input" rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Book description…" required />
          </div>

          {/* AI Generate */}
          <div style={{ marginBottom:16 }}>
            <button type="button" onClick={generateAIMeta} disabled={!title || !description || aiLoading} className="btn btn-ghost" style={{ fontSize:13, gap:6 }}>
              <Sparkles size={14} color="var(--gold)" />
              {aiLoading ? 'Generating…' : 'Generate AI Summary & Chapter Titles'}
            </button>
            {generatedMeta && (
              <div style={{ marginTop:12, padding:'14px 16px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:10 }}>
                <p style={{ fontSize:11, color:'var(--gold)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>AI Generated</p>
                <p style={{ fontSize:13, color:'var(--text)', fontWeight:600, marginBottom:4 }}>"{generatedMeta.tagline}"</p>
                <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>{generatedMeta.summary}</p>
              </div>
            )}
          </div>

          {/* Genres */}
          <div style={{ marginBottom:16 }}>
            <label className="label">Genres</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {GENRES.map(g => (
                <button key={g} type="button" onClick={() => setGenre(p => p.includes(g) ? p.filter(x=>x!==g) : [...p,g])}
                  style={{ padding:'5px 12px', borderRadius:99, fontSize:12, cursor:'pointer', transition:'all .15s',
                    background: genre.includes(g) ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                    color: genre.includes(g) ? 'var(--gold)' : 'var(--text-muted)',
                    border: `1px solid ${genre.includes(g) ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}>{g}</button>
              ))}
            </div>
          </div>

          {/* File uploads */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
            <div>
              <label className="label">Audio File * (mp3, m4b, m4a)</label>
              <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:'24px', borderRadius:10, border:'2px dashed var(--border)', cursor:'pointer', background:'var(--bg-input)', transition:'border-color .2s' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) setAudioFile(f) }}>
                <Upload size={24} color="var(--text-dim)" />
                <span style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>{audioFile ? audioFile.name : 'Drop audio file or click to browse'}</span>
                <input type="file" accept=".mp3,.m4b,.m4a,.ogg,.wav" onChange={e => setAudioFile(e.target.files?.[0] ?? null)} style={{ display:'none' }} />
              </label>
            </div>
            <div>
              <label className="label">Cover Image (jpg, png, webp)</label>
              <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:'24px', borderRadius:10, border:'2px dashed var(--border)', cursor:'pointer', background:'var(--bg-input)' }}>
                {coverFile
                  ? <img src={URL.createObjectURL(coverFile)} alt="" style={{ width:'100%', height:80, objectFit:'cover', borderRadius:6 }} />
                  : <><Upload size={24} color="var(--text-dim)" /><span style={{ fontSize:12, color:'var(--text-muted)' }}>Drop cover or click to browse</span></>
                }
                <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] ?? null)} style={{ display:'none' }} />
              </label>
            </div>
          </div>

          {uploadProgress && (
            <div style={{ padding:'10px 14px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, fontSize:13, color:'var(--gold)', marginBottom:16 }}>
              ⏳ {uploadProgress}
            </div>
          )}

          <button type="submit" disabled={uploading || !audioFile} className="btn btn-gold" style={{ fontSize:15, padding:'12px 28px' }}>
            {uploading ? 'Uploading…' : '⬆ Upload Audiobook'}
          </button>
        </form>
      )}
    </div>
  )
}
