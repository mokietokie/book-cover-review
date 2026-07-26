# TRD — 책표지 리뷰 큐레이션 서비스 (스켈레톤 MVP)

관련 문서: [PRD.md](./PRD.md)

## 1. 아키텍처 개요

Next.js(App Router) 단일 앱으로 구성. 프론트엔드(업로드 UI, 결과/목록 화면)와 백엔드 로직(Route Handlers)을 한 프로젝트에서 처리하는 모놀리식 구조. 별도 서버 인프라 없이 Vercel 등에 배포 가능한 형태를 전제로 한다.

```
[Browser]
   │ 이미지 업로드
   ▼
[Next.js Route Handler: /api/identify]
   │ 이미지 → Vision LLM 호출 → { title, author } 추출
   ▼
[Next.js Route Handler: /api/aladin/search]
   │ title/author 텍스트 검색 → 후보 리스트(ISBN 포함) → 최상위 1건 채택
   ▼
[Next.js Route Handler: /api/aladin/lookup]
   │ ISBN → 상세정보/카테고리/평점/리뷰(OptResult=reviewList)
   ▼
[Next.js Route Handler: /api/books] ── 저장/조회 ──▶ [Supabase Postgres]
   ▲
[Browser] ◀── 목록/상세 렌더링(카테고리별 그룹핑, 교보/YES24 링크 포함)
```

## 2. 외부 연동

### 2.1 Vision LLM (표지 인식)
- Anthropic Messages API에 이미지를 첨부해 호출, "표지에서 책 제목과 저자를 JSON으로 추출" 하는 프롬프트 사용.
- 응답 예: `{ "title": "...", "author": "..." }`
- 제목/저자 모두 비어있으면 인식 실패로 처리하고 사용자에게 재시도 안내.

### 2.2 알라딘 Open API
- 검색: `GET https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=[TTBKey]&Query=[title author]&QueryType=Keyword&output=js&Version=20131101`
  - 응답 중 최상위 1건의 `isbn13`(또는 `isbn`) 사용.
- 상세조회: `GET https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=[TTBKey]&itemIdType=ISBN13&ItemId=[isbn]&output=js&Version=20131101&OptResult=reviewList`
  - 응답에서 `categoryName`, `customerReviewRank`, `reviewList`(또는 유사 필드), `cover`, `title`, `author` 등을 파싱.
- TTBKey는 서버 사이드 환경변수로만 보관, 클라이언트에 노출 금지.

### 2.3 교보문고 / YES24
- 공식 리뷰 API 없음 → 실제 호출 없이 검색 URL만 생성해서 링크로 제공.
  - 예: `https://search.kyobobook.co.kr/search?keyword=<title>`, `https://www.yes24.com/product/search?query=<title>`

### 2.4 Supabase
- Postgres 기반. **Phase 2부터 인증이 도입되면서 클라이언트 역할이 분리된다**:
  - `lib/supabase.ts` (Service Role Key, 기존): RLS를 우회해야 하는 관리 작업(레거시 데이터 마이그레이션 등)에만 한정 사용.
  - `lib/supabase/server.ts` (신규, `@supabase/ssr`): 요청의 쿠키에서 사용자 세션을 읽어 **anon key + 사용자 JWT**로 동작하는 서버 클라이언트. `/api/books` GET/POST 등 사용자 데이터 접근은 전부 이 클라이언트로 전환해 RLS가 실제로 걸리게 한다.
  - `lib/supabase/client.ts` (신규, `@supabase/ssr`): 로그인/회원가입 폼 등 브라우저에서 직접 Supabase Auth를 호출해야 하는 곳에서 사용(anon key).
- `middleware.ts`(신규)에서 `@supabase/ssr`의 세션 갱신 로직을 실행해 만료된 액세스 토큰을 자동 리프레시.

## 3. 디렉토리 구조 (제안)

```
app/
  page.tsx                 # 업로드 화면 (비로그인도 접근 가능)
  books/page.tsx           # 카테고리별 목록 화면 (로그인 필요)
  login/page.tsx           # 로그인 (신규)
  signup/page.tsx          # 회원가입 (신규)
  api/
    identify/route.ts      # Vision LLM 호출 (인증 불필요)
    aladin/search/route.ts # 알라딘 검색 (인증 불필요)
    aladin/lookup/route.ts # 알라딘 상세조회 (인증 불필요)
    books/route.ts         # Supabase CRUD (GET: 본인 목록, POST: 저장 — 둘 다 로그인 필요)
    auth/logout/route.ts   # 로그아웃 (신규)
lib/
  vision.ts                # Vision LLM 클라이언트 래퍼
  aladin.ts                # 알라딘 API 클라이언트 래퍼
  supabase.ts              # Supabase 서버 클라이언트 (Service Role, 관리 작업 전용)
  supabase/
    server.ts              # 신규: 사용자 세션 기반 서버 클라이언트 (RLS 적용)
    client.ts               # 신규: 브라우저용 클라이언트 (로그인/가입 폼)
middleware.ts               # 신규: Supabase 세션 갱신
```

## 4. 데이터 모델

Supabase `books` 테이블:

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK, default gen_random_uuid()) | |
| image_url | text | 업로드된 표지 이미지 URL/경로 |
| title | text | 인식/확정된 제목 |
| author | text | 인식/확정된 저자 |
| isbn | text | 알라딘 ISBN13 |
| aladin_item_id | text | 알라딘 상품 고유 ID |
| category_name | text | 알라딘 categoryName |
| publisher | text | 알라딘 출판사명 |
| pub_date | text | 알라딘 출판일 |
| description | text | 알라딘 책 소개(item.description) |
| cover_url | text | 알라딘 표지 이미지 URL(목록 화면 썸네일용, Step 6에서 추가) |
| customer_review_rank | numeric | 알라딘 평점 |
| reviews | jsonb | 알라딘 리뷰 목록(원본 일부) |
| kyobo_search_url | text | 교보문고 검색 링크 |
| yes24_search_url | text | YES24 검색 링크 |
| user_id | uuid, nullable, references auth.users(id) | Phase 2부터 로그인 사용자의 UUID를 채움 |
| created_at | timestamptz, default now() | 최초 저장 시각 |
| updated_at | timestamptz, default now() | 마지막으로 (재)조회한 시각. 목록/상세 화면에 "OOOO.OO.OO 조회"로 표시 |
| status | text, default 'wishlist', check in ('wishlist','passed') | Phase 3: 사고싶음/패스 2단계 상태 태그 |

**Phase 2 변경**: 로그인 사용자가 저장하는 모든 신규 레코드는 `user_id = auth.uid()`로 채워진다. 비로그인 사용자는애초에 `POST /api/books`를 호출할 수 없으므로(401) 이후 `user_id IS NULL`인 레코드는 새로 생기지 않는다. 컬럼 자체는 계속 nullable로 두되(레거시 레코드 호환), RLS 정책은 `auth.uid() = user_id`만 허용한다.

**중복 스캔 처리(신규)**: 같은 책(동일 `isbn`)을 같은 사용자가 다시 스캔하면 새 행을 추가하지 않고 기존 행을 갱신한다(`(user_id, isbn)` unique 제약 + upsert, `updated_at`을 현재 시각으로 갱신). 목록에는 항상 책당 1건만 존재한다. 재스캔 시 upsert는 `status`를 건드리지 않는다(이미 "패스"로 표시한 책을 다시 스캔했다고 "사고싶음"으로 되돌리지 않음).

**Phase 3 — status 태그**: 신규 저장 시 기본값은 `wishlist`(사고싶음). 목록/상세 화면에서 `PATCH /api/books/[id]`로 `status`만 변경한다. 알라딘 평점(`customer_review_rank`)과는 무관한 별도 필드.

### 4.1 RLS 정책 (Phase 2 신규)

```sql
alter table books enable row level security;

create policy "본인 책만 조회" on books
  for select using (auth.uid() = user_id);

create policy "본인 책만 저장" on books
  for insert with check (auth.uid() = user_id);

create policy "본인 책만 수정" on books
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "본인 책만 삭제" on books
  for delete using (auth.uid() = user_id);
```

Service Role Key(`lib/supabase.ts`)는 RLS를 우회하므로, 이 클라이언트를 쓰는 관리 작업(레거시 마이그레이션)에서만 예외적으로 `user_id`가 NULL인 레코드에 접근한다.

### 4.2 레거시 데이터 마이그레이션 (Phase 2, 1회성 수동 작업)

기존 `user_id IS NULL` 레코드를 최초 가입 계정으로 귀속시킨다. 사용자가 Supabase SQL Editor에서 최초 가입 후 아래 SQL을 1회 실행(본인 UUID는 Supabase Auth 대시보드의 `auth.users`에서 확인):

```sql
update books set user_id = '<최초 가입한 본인 계정의 uuid>' where user_id is null;
```

## 5. 환경 변수

- `ALADIN_TTBKEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 클라이언트 번들에 절대 노출 금지)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Phase 2 신규, 클라이언트 노출 가능 — RLS로 보호되므로 anon key 자체는 공개되어도 안전)

## 6. 에러 처리 방침 (스켈레톤 최소 수준)

- Vision LLM이 제목/저자를 못 뽑으면: "표지를 인식하지 못했어요, 다시 시도해주세요" 안내.
- 알라딘 검색 결과가 0건이면: "알라딘에서 이 책을 찾지 못했어요" 안내, 저장하지 않음.
- 외부 API 호출 실패(네트워크/레이트리밋 등)는 공통 에러 메시지로 처리하고 재시도 버튼 제공. 세밀한 에러 분기는 범위 밖.

## 7. 추후 검토 항목

- GCP Cloud Vision OCR을 보조/폴백 인식기로 추가할지 여부
- 교보문고/YES24 리뷰까지 통합하려면 스크래핑 or 공식 파트너십 필요 — ToS 검토 후 결정
- 검색 결과가 여러 건일 때 사용자가 직접 후보를 선택하는 UI
- 알라딘 categoryName을 넘어서는 자체 LLM 기반 재분류
- 비밀번호 재설정, 소셜 로그인 (Phase 2에서는 제외, v0.2 이후 검토)
- 다중 사용자 간 책 목록 공유 기능

## 8. 검증 방법 (이번 문서화 단계)

- 코드 구현 없음. 사용자가 본 PRD.md/TRD.md를 검토해 Q&A에서 확정한 스켈레톤 MVP 범위와 일치하는지 확인하는 것으로 검증 완료.
- 실제 동작 검증(업로드 → 인식 → 알라딘 조회 → 저장 → 목록 표시)은 이후 구현 단계에서 진행.
