-- ── InkPlay Database Schema ──────────────────────────────────────────────────
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  display_name    text not null default 'Book Lover',
  avatar_url      text,
  is_admin        boolean not null default false,
  playback_speed  numeric(3,2) not null default 1.0,
  created_at      timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Book Lover'));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Books ─────────────────────────────────────────────────────────────────────
create table books (
  id                  uuid primary key default uuid_generate_v4(),
  slug                text unique not null,
  title               text not null,
  author              text not null,
  narrator            text,
  description         text not null default '',
  summary             text,
  tagline             text,
  cover_url           text,
  genre               text[] not null default '{}',
  language            text not null default 'English',
  year                int,
  isbn                text,
  total_duration_sec  int not null default 0,
  chapter_count       int not null default 0,
  status              text not null default 'draft'
                      check (status in ('draft','published','hidden','archived')),
  content_warnings    text[] default '{}',
  hidden_at           timestamptz,
  hidden_by           uuid references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── Chapters ──────────────────────────────────────────────────────────────────
create table chapters (
  id           uuid primary key default uuid_generate_v4(),
  book_id      uuid references books(id) on delete cascade not null,
  title        text not null,
  order_index  int not null,
  start_sec    int not null default 0,
  end_sec      int not null,
  duration_sec int generated always as (end_sec - start_sec) stored,
  audio_path   text not null,   -- private storage path, never exposed to client
  transcript   text,
  created_at   timestamptz not null default now(),
  unique(book_id, order_index)
);

-- ── User Progress ─────────────────────────────────────────────────────────────
create table user_progress (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references profiles(id) on delete cascade not null,
  book_id        uuid references books(id) on delete cascade not null,
  chapter_id     uuid references chapters(id) not null,
  position_sec   int not null default 0,
  completed      boolean not null default false,
  last_played_at timestamptz not null default now(),
  unique(user_id, book_id)
);

-- ── User Library ──────────────────────────────────────────────────────────────
create table user_library (
  id       uuid primary key default uuid_generate_v4(),
  user_id  uuid references profiles(id) on delete cascade not null,
  book_id  uuid references books(id) on delete cascade not null,
  status   text not null default 'wishlist'
           check (status in ('wishlist','in_progress','completed')),
  added_at timestamptz not null default now(),
  unique(user_id, book_id)
);

-- ── Bookmarks ─────────────────────────────────────────────────────────────────
create table bookmarks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade not null,
  book_id     uuid references books(id) on delete cascade not null,
  chapter_id  uuid references chapters(id) not null,
  position_sec int not null,
  note        text,
  created_at  timestamptz not null default now()
);

-- ── Reviews ───────────────────────────────────────────────────────────────────
create table reviews (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade not null,
  book_id    uuid references books(id) on delete cascade not null,
  rating     int not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz not null default now(),
  unique(user_id, book_id)
);

-- ── Visibility Log ────────────────────────────────────────────────────────────
create table visibility_log (
  id         uuid primary key default uuid_generate_v4(),
  book_id    uuid references books(id) on delete cascade not null,
  admin_id   uuid references profiles(id) not null,
  action     text not null check (action in ('hide','publish','archive')),
  reason     text,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table profiles      enable row level security;
alter table books         enable row level security;
alter table chapters      enable row level security;
alter table user_progress enable row level security;
alter table user_library  enable row level security;
alter table bookmarks     enable row level security;
alter table reviews       enable row level security;
alter table visibility_log enable row level security;

-- Profiles: users see own, admins see all
create policy "profiles_own"  on profiles for all using (auth.uid() = id);
create policy "profiles_admin" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Books: published visible to all; hidden only to in-progress users; admins see all
create policy "books_published" on books for select using (status = 'published');
create policy "books_hidden_inprogress" on books for select using (
  status = 'hidden' and exists (
    select 1 from user_library
    where user_id = auth.uid() and book_id = books.id and status = 'in_progress'
  )
);
create policy "books_admin" on books for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Chapters: follow book visibility
create policy "chapters_read" on chapters for select using (
  exists (
    select 1 from books where id = chapters.book_id
    and (
      status = 'published'
      or (status = 'hidden' and exists (
        select 1 from user_library
        where user_id = auth.uid() and book_id = books.id and status = 'in_progress'
      ))
      or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    )
  )
);

-- User data: own rows only
create policy "progress_own"  on user_progress  for all using (user_id = auth.uid());
create policy "library_own"   on user_library   for all using (user_id = auth.uid());
create policy "bookmarks_own" on bookmarks      for all using (user_id = auth.uid());
create policy "reviews_own"   on reviews        for all using (user_id = auth.uid());
create policy "reviews_read"  on reviews        for select using (true);
create policy "vislog_admin"  on visibility_log for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index on books(status);
create index on books(slug);
create index on chapters(book_id, order_index);
create index on user_progress(user_id, book_id);
create index on user_library(user_id, status);
create index on reviews(book_id);
