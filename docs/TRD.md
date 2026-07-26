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
- Postgres 기반, 서버 사이드에서는 Service Role Key로 접근(RLS 우회, 스켈레톤 단계는 인증 없음).
- `@supabase/supabase-js` 클라이언트를 `lib/supabase.ts`에서 서버 전용으로 초기화.

## 3. 디렉토리 구조 (제안)

```
app/
  page.tsx                 # 업로드 화면
  books/page.tsx           # 카테고리별 목록 화면
  api/
    identify/route.ts      # Vision LLM 호출
    aladin/search/route.ts # 알라딘 검색
    aladin/lookup/route.ts # 알라딘 상세조회
    books/route.ts         # Supabase CRUD (GET: 목록, POST: 저장)
lib/
  vision.ts                # Vision LLM 클라이언트 래퍼
  aladin.ts                # 알라딘 API 클라이언트 래퍼
  supabase.ts              # Supabase 서버 클라이언트
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
| user_id | uuid, nullable | 추후 Supabase Auth 연동 대비, 현재는 미사용 |
| created_at | timestamptz, default now() | |

인증이 없는 스켈레톤 단계에서는 `user_id`를 NULL로 두고 전체 데이터를 단일 사용자 것으로 취급한다. 추후 Supabase Auth 도입 시 이 컬럼을 채우고 RLS 정책을 추가하는 방식으로 확장한다.

## 5. 환경 변수

- `ALADIN_TTBKEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 클라이언트 번들에 절대 노출 금지)

## 6. 에러 처리 방침 (스켈레톤 최소 수준)

- Vision LLM이 제목/저자를 못 뽑으면: "표지를 인식하지 못했어요, 다시 시도해주세요" 안내.
- 알라딘 검색 결과가 0건이면: "알라딘에서 이 책을 찾지 못했어요" 안내, 저장하지 않음.
- 외부 API 호출 실패(네트워크/레이트리밋 등)는 공통 에러 메시지로 처리하고 재시도 버튼 제공. 세밀한 에러 분기는 범위 밖.

## 7. 추후 검토 항목

- GCP Cloud Vision OCR을 보조/폴백 인식기로 추가할지 여부
- 교보문고/YES24 리뷰까지 통합하려면 스크래핑 or 공식 파트너십 필요 — ToS 검토 후 결정
- 검색 결과가 여러 건일 때 사용자가 직접 후보를 선택하는 UI
- 알라딘 categoryName을 넘어서는 자체 LLM 기반 재분류
- Supabase Auth 연동을 통한 다중 사용자 지원 및 RLS 정책 설계

## 8. 검증 방법 (이번 문서화 단계)

- 코드 구현 없음. 사용자가 본 PRD.md/TRD.md를 검토해 Q&A에서 확정한 스켈레톤 MVP 범위와 일치하는지 확인하는 것으로 검증 완료.
- 실제 동작 검증(업로드 → 인식 → 알라딘 조회 → 저장 → 목록 표시)은 이후 구현 단계에서 진행.
