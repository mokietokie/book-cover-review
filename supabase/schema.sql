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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 기존 테이블에 이미 존재하는 경우를 위한 마이그레이션 (신규 생성 시에는 no-op)
alter table public.books add column if not exists publisher text;
alter table public.books add column if not exists pub_date text;
alter table public.books add column if not exists description text;

-- docs/TRD.md 4.1절 RLS 정책 (Phase 2, Step 9-3에서 Supabase SQL Editor로 실행)
alter table public.books enable row level security;

drop policy if exists "본인 책만 조회" on public.books;
create policy "본인 책만 조회" on public.books
  for select using (auth.uid() = user_id);

drop policy if exists "본인 책만 저장" on public.books;
create policy "본인 책만 저장" on public.books
  for insert with check (auth.uid() = user_id);

drop policy if exists "본인 책만 수정" on public.books;
create policy "본인 책만 수정" on public.books
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "본인 책만 삭제" on public.books;
create policy "본인 책만 삭제" on public.books
  for delete using (auth.uid() = user_id);

-- 같은 책(ISBN) 재스캔 시 새 행 대신 기존 행을 갱신하기 위한 준비 (신규 기능)
-- 1) updated_at 컬럼 추가 및 기존 행 백필 (신규 생성 시 컬럼 자체는 이미 위 create table에 포함되지만,
--    기존에 운영 중이던 테이블에는 없을 수 있으므로 방어적으로 추가)
alter table public.books add column if not exists updated_at timestamptz;
update public.books set updated_at = created_at where updated_at is null;
alter table public.books alter column updated_at set default now();
alter table public.books alter column updated_at set not null;

-- 2) 기존에 쌓인 (user_id, isbn) 중복 행 정리 — 그룹별로 가장 최근(updated_at, created_at, id 순) 1건만 남기고 삭제
delete from public.books a
using public.books b
where a.user_id is not null
  and a.isbn is not null
  and a.user_id = b.user_id
  and a.isbn = b.isbn
  and (
    a.updated_at < b.updated_at
    or (a.updated_at = b.updated_at and a.created_at < b.created_at)
    or (a.updated_at = b.updated_at and a.created_at = b.created_at and a.id < b.id)
  );

-- 3) 같은 사용자·같은 ISBN 조합은 한 행만 존재하도록 unique 제약 추가 (upsert의 충돌 대상)
create unique index if not exists books_uidx on public.books (user_id, isbn);
