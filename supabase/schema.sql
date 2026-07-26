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
  customer_review_rank numeric,
  reviews jsonb,
  kyobo_search_url text,
  yes24_search_url text,
  user_id uuid,
  created_at timestamptz not null default now()
);
