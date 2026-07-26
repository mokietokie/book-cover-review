-- docs/TRD.md 4절 데이터 모델
create extension if not exists pgcrypto;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  title text,
  author text,
  isbn text,
  aladin_item_id text,
  category_name text,
  publisher text,
  pub_date text,
  description text,
  cover_url text,
  customer_review_rank numeric,
  reviews jsonb,
  kyobo_search_url text,
  yes24_search_url text,
  user_id uuid,
  created_at timestamptz not null default now()
);

-- 기존 테이블에 이미 존재하는 경우를 위한 마이그레이션 (신규 생성 시에는 no-op)
alter table public.books add column if not exists publisher text;
alter table public.books add column if not exists pub_date text;
alter table public.books add column if not exists description text;

-- docs/TRD.md 4.1절 RLS 정책 (Phase 2, Step 9-3에서 Supabase SQL Editor로 실행)
alter table public.books enable row level security;

create policy "본인 책만 조회" on public.books
  for select using (auth.uid() = user_id);

create policy "본인 책만 저장" on public.books
  for insert with check (auth.uid() = user_id);
