# TODO — 책표지 리뷰 큐레이션 서비스 빌드 체크리스트

참고 문서: [docs/PRD.md](./docs/PRD.md), [docs/TRD.md](./docs/TRD.md), [docs/UXUI.md](./docs/UXUI.md)

이 문서는 스켈레톤 MVP를 처음부터 끝까지 구현하기 위한 단계별 작업 목록이다. 각 스텝은 **목표 / 대상 파일 / 완료 기준 / 막혔을 때 대응**으로 구성되어 있어, 중간에 에러가 나도 스스로 원인을 좁혀가며 해결할 수 있도록 만들었다.

## 실패 시 공통 대응 원칙

1. 에러 메시지·스택트레이스를 먼저 읽고, 어느 스텝/파일에서 난 것인지 특정한다.
2. 원인이 **코드 버그**면 직접 수정하고 재검증한다.
3. 원인이 **외부 API 응답 스펙 차이**(예: 알라딘 응답 필드명이 문서와 다름)면, 실제 응답을 로그로 찍어 확인 후 파싱 로직을 응답에 맞게 수정한다. `docs/TRD.md`의 스펙은 참고용이며 실제 응답이 우선한다.
4. 원인이 **환경변수/키 누락 등 사용자만 할 수 있는 조치**(예: Supabase 프로젝트 생성, TTBKey 발급)면, 해당 스텝을 "블로킹"으로 표시하고 다음으로 넘어갈 수 있는 독립적인 스텝이 있으면 먼저 진행한다.
5. 스코프를 임의로 넓히거나 줄이지 않는다 — `docs/PRD.md`의 In/Out of Scope가 기준이다. 애매하면 Out of Scope 쪽으로 판단한다.
6. 각 스텝 완료 시 체크박스를 갱신하고, 무엇을 검증했는지 한 줄로 남긴다.

---

## Step 0. 프로젝트 스캐폴딩

- [x] 0-1. Next.js(App Router, TypeScript) 프로젝트 초기화 (`create-next-app`) — 임시 디렉터리에 스캐폴딩 후 기존 `CLAUDE.md`/`todo.md`/`docs/`를 보존하며 병합
- [x] 0-2. Tailwind CSS 설정 확인 (App Router 템플릿에 기본 포함되는지 확인, `docs/UXUI.md` 0절 팔레트를 `tailwind.config` 또는 CSS 변수에 반영할지 검토 — 기본 Tailwind 그레이스케일 토큰 그대로 써도 무방하므로 커스텀 설정은 최소화) — Tailwind v4(PostCSS 플러그인) 기본 템플릿 그대로 사용, 커스텀 설정 없음
- [x] 0-3. `@supabase/supabase-js`, `@anthropic-ai/sdk` 설치 — `npm install` 완료, `package.json`에 반영
- [x] 0-4. `.env.example` 작성 (`ALADIN_TTBKEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — 실제 값은 `.env.local`에 사용자가 채움
- [x] 0-5. 기본 lint/format 동작 확인 (`npm run lint`) — 에러 없음 확인

**완료 기준**: `npm run dev`로 기본 Next.js 페이지가 뜬다. — 확인 완료 (`curl localhost:3000` → HTTP 200)
**막히면**: 버전 충돌/피어디펜던시 에러는 `package.json` 버전 고정 후 재설치로 해결.

## Step 1. 외부 서비스 준비 (사용자 조치 필요 — 블로킹 가능 구간)

- [x] 1-1. Supabase 프로젝트 생성 및 `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 발급 → `.env.local`에 입력 **(사용자)** — 프로젝트 `fatyiomwlpgmittbsvnj`, 새 API 키 체계의 secret key를 `SUPABASE_SERVICE_ROLE_KEY`로 사용
- [x] 1-2. 알라딘 TTBKey 발급(알라딘 회원가입 후 Open API 신청) → `.env.local`에 입력 **(사용자)** — `ttbjlee01261418001` 발급 확인, `.env.local`에 반영
- [x] 1-3. Anthropic API 키 발급 → `.env.local`에 입력 **(사용자)**

**완료 기준**: `.env.local`에 4개 값이 모두 채워져 있다. — 4개 값 모두 확인 완료.
**막히면**: 이 스텝은 자동화 불가 — 값이 없으면 Step 2~4는 코드까지만 작성하고 실제 호출 검증은 값이 채워진 뒤로 미룬다. Step 0, 5(UI 정적 부분)는 키 없이도 진행 가능하므로 먼저 처리.

## Step 2. Supabase 스키마 생성

- [x] 2-1. `docs/TRD.md` 4절 스키마대로 `books` 테이블 생성 SQL 작성 (`supabase/schema.sql` 등에 보관) — `supabase/schema.sql` 작성 완료
- [x] 2-2. Supabase SQL Editor(또는 CLI)로 실제 테이블 생성 — 사용자가 SQL Editor에서 실행, REST API로 `books` 테이블 조회(`200`, `[]`) 확인
- [x] 2-3. `lib/supabase.ts` 서버 전용 클라이언트 작성 (Service Role Key 사용, 클라이언트 번들에 노출되지 않도록 `"server-only"` 처리) — `server-only` 패키지 적용, 임시 스크립트로 실제 쿼리 성공 확인 후 삭제

**완료 기준**: Supabase 대시보드에서 `books` 테이블과 전체 컬럼이 스키마대로 보인다. — REST API 조회로 확인 완료.
**막히면**: RLS가 기본 활성화되어 쓰기가 막히면, 스켈레톤 단계는 인증이 없으므로 Service Role Key 경로만 쓰는지 확인(Service Role은 RLS 우회). 우회가 안 되면 해당 테이블 RLS를 임시 비활성화.

## Step 3. 외부 API 연동 레이어 (`lib/`)

- [x] 3-1. `lib/vision.ts`: 이미지 → Anthropic Messages API 호출 → `{ title, author }` JSON 추출 함수. 실패/빈 값 시 명확한 에러 타입 반환. — `VisionRecognitionError` 정의, 실제 표지 사진으로 `{"title":"해리포터와 마법사의 돌","author":"J.K. Rowling"}` 정상 추출 확인
- [x] 3-2. `lib/aladin.ts`: `searchBooks(query)` (ItemSearch 호출, 후보 배열 반환) / `lookupBook(isbn)` (ItemLookUp + `OptResult=reviewList` 호출, 상세+리뷰+카테고리+평점 파싱) 두 함수 작성. — 작성 완료
- [x] 3-3. 위 두 파일에 대해 실제 키가 있다면 임시 스크립트(`scripts/` 또는 `.test`)로 단독 호출해 응답 구조를 확인하고, `docs/TRD.md`에 적힌 필드명과 실제 응답이 다르면 파싱 로직을 실제 응답 기준으로 맞춘다. — 임시 스크립트로 실제 호출 확인 후 정리(파일 남기지 않음). **발견**: `OptResult=reviewList`를 요청해도 알라딘이 실제 리뷰 내용을 반환하지 않음(여러 인기 도서로 확인, `ratingInfo`의 `commentReviewCount`가 0이 아닌 경우도 동일) — 알라딘 정책 변경으로 추정, TRD 문서와 실제 응답이 다른 부분. `title`/`author`/`isbn13`/`cover`/`categoryName`/`customerReviewRank`는 TRD 필드명과 일치. `lib/aladin.ts`는 `reviews`가 빈 배열이어도 정상 동작하도록 이미 방어적으로 작성됨. **추가 수정**: 정수(0~10)뿐인 `customerReviewRank` 대신 `OptResult=ratingInfo`의 `ratingScore`(소수점 첫째자리)를 우선 사용하도록 변경(둘 다 컬럼명은 `customer_review_rank` 그대로, 값만 더 정밀하게).

**완료 기준**: 샘플 제목("해리포터와 마법사의 돌" 등)으로 `searchBooks` → `lookupBook`을 호출했을 때 정상적으로 ISBN·카테고리·평점·리뷰가 반환된다. — ISBN/카테고리/평점 확인, 리뷰는 위 발견사항대로 알라딘 응답 자체가 비어 있음.
**막히면**: 알라딘 API는 파라미터 오타(대소문자, `Version` 값)에 민감함 — 공식 문서 URL 포맷을 다시 대조. 401/403이면 TTBKey 미승인 상태일 수 있으니 알라딘 개발자센터에서 키 상태 확인 필요(사용자 조치).

## Step 4. API 라우트 (`app/api/`)

- [x] 4-1. `app/api/identify/route.ts`: 업로드된 이미지를 받아 `lib/vision.ts` 호출, `{ title, author }` 반환. 인식 실패 시 에러 코드로 구분되게 응답. — `FormData`(`image` 필드) 파싱, 성공/실패(422)/파일없음(400) 확인
- [x] 4-2. `app/api/aladin/search/route.ts`: title/author 텍스트로 `lib/aladin.searchBooks` 호출, 최상위 1건 반환. — 정상/0건(404) 확인
- [x] 4-3. `app/api/aladin/lookup/route.ts`: ISBN으로 `lib/aladin.lookupBook` 호출, 상세 반환. — 정상/not-found(404) 확인. **버그 발견 및 수정**: 존재하지 않는 ISBN(`0000000000000` 등)에 알라딘이 에러 대신 중고 판매자가 등록한 더미 ISBN 상품(`mallType:"USED"`)을 반환하는 경우가 있어, `lib/aladin.ts`의 `lookupBook`에 `item.mallType !== "BOOK"`이면 null(not found) 처리하는 방어 로직 추가.
- [x] 4-4. `app/api/books/route.ts`: `GET`(전체 목록, 카테고리별 그룹 가능하도록 정렬), `POST`(식별 결과 저장 — 이때 `kyobo_search_url`/`yes24_search_url`도 함께 생성해 저장) 구현. — `GET`은 `{ categories: [{ categoryName, books }] }` 형태로 이미 그룹핑해서 반환(Step 6에서 바로 렌더링 가능). `reviews` 컬럼은 알라딘이 개별 리뷰를 안 주므로 집계 통계(`ratingCount`/`commentReviewCount`/`myReviewCount`) 객체를 저장.
- [x] 4-5. 각 라우트에 대해 curl 또는 `fetch`로 수동 호출해 정상/에러 응답 확인. — 4개 라우트 모두 정상/실패 케이스 curl로 검증, 테스트로 저장한 더미 레코드는 삭제해 원상복구.

**완료 기준**: 4개 라우트 모두 정상 케이스·실패 케이스(빈 값, 0건 검색 등)에서 `docs/TRD.md` 6절 에러 정책에 맞는 응답을 준다. — 확인 완료.
**막히면**: 이미지 업로드 바디 파싱(FormData vs base64) 이슈가 흔함 — Route Handler에서 `request.formData()` 사용 여부를 먼저 확정하고 프론트와 계약을 맞춘다.

**참고**: `image_url` 컬럼에 넣을 실제 이미지 저장(Supabase Storage 등)은 `docs/TRD.md`/`todo.md`에 별도 단계가 없어 이번 Step에서는 다루지 않음(`POST /api/books`는 `imageUrl`을 optional로 받아 없으면 `null` 저장). Step 5에서 필요해지면 논의.

## Step 5. 업로드 화면 (`app/page.tsx`)

`docs/UXUI.md` 1~4절 와이어프레임 기준.

- [x] 5-1. Empty 상태: 드롭존 UI, 파일 선택 처리 — 클릭/드래그앤드롭 모두 처리
- [x] 5-2. Selected 상태: 미리보기, "다시 선택"/"이 책 식별하기" 버튼
- [x] 5-3. 인식 중 상태: 3단계 체크리스트 UI + 실제 API 3연쇄 호출(`/api/identify` → `/api/aladin/search` → `/api/aladin/lookup`) 순차 연동, 완료 시 `/api/books POST`로 자동 저장
- [x] 5-4. 결과 화면: 표지·평점·카테고리·리뷰 목록·저장 완료 표시·교보/YES24 링크·"다른 표지 업로드하기"
- [x] 5-5. 에러 상태: 각 단계 API가 반환하는 TRD 6절 문구를 그대로 표시(하드코딩 대신 `error` 필드 사용), "다시 시도"/"다른 사진 선택"
- [x] 5-6. 모노톤 스타일 가이드(0절 팔레트) 준수 여부 셀프 체크 — `grep -rn "bg-gradient\|backdrop-blur\|dark:" app/` 결과 없음 확인, `app/globals.css`의 스캐폴딩 기본 다크모드 미디어쿼리도 제거
- [x] 5-7. Empty 상태에 "카메라로 촬영" 버튼 추가 — 모바일에서 폰 카메라로 표지를 바로 찍어 업로드할 수 있도록, `getUserMedia` 기반 라이브러리 대신 `<input type="file" accept="image/*" capture="environment">` 사용(별도 의존성/API 변경 없이 기존 `handleFileSelected`·Selected 상태 그대로 재사용). 실제 스마트폰(같은 Wi-Fi, `next.config.ts`에 `allowedDevOrigins` 추가)으로 접속해 카메라 촬영 → 식별 → 결과 화면까지 수동 확인 완료.

**완료 기준**: 실제 표지 사진 하나를 업로드해 Empty → Selected → 인식 중 → 결과까지 화면 전환이 매끄럽게 동작한다. — 브라우저 자동화 툴 미설치로 UI 클릭 자체는 수동 검증 필요하나, `page.tsx`가 호출하는 4개 API(`/api/identify` → `/api/aladin/search` → `/api/aladin/lookup` → `/api/books`)를 실제 표지 사진(`test-images/test1.jpg`)으로 동일한 순서·페이로드로 curl 호출해 정상 동작 및 응답 필드 일치 확인, 테스트로 저장된 레코드는 삭제해 원상복구. 카메라 촬영 경로(5-7)는 실제 스마트폰 수동 테스트로 별도 확인 완료.
**막히면**: 상태 전환이 꼬이면 페이지 내부를 `idle | selected | identifying | result | error` 같은 단일 상태 머신으로 정리해서 버그를 좁힌다. — 실제로 이 구조로 구현.

## Step 6. 목록 화면 (`app/books/page.tsx`)

`docs/UXUI.md` 5절 기준.

- [x] 6-1. `GET /api/books` 결과를 `category_name` 기준으로 그룹핑해 섹션별 렌더링 — 그룹핑은 이미 Step 4-4에서 API가 수행, 이번에 `docs/UXUI.md` 5-1 "저장된 책이 많은 순" 규칙에 맞춰 카테고리 배열을 `books.length` 내림차순 정렬하도록 `app/api/books/route.ts` 수정
- [x] 6-2. 카드 그리드 반응형(`grid-cols-2 → sm:grid-cols-4 → lg:grid-cols-6`) 적용 — `app/books/page.tsx`에 그대로 적용
- [x] 6-3. Empty 상태(저장된 책 없음) UI — 구현 완료
- [x] 6-4. 카드 클릭 시 상세(결과 화면 레이아웃 재사용, 저장 배너 없이) 표시 — 결과 화면(Step 5)의 인라인 마크업을 `components/BookDetailView.tsx`로 추출해 `app/page.tsx`(저장 배너 있음)와 `app/books/page.tsx`(저장 배너 없음, 클릭 시 같은 페이지 내에서 목록↔상세 토글) 양쪽에서 재사용

**스키마 변경 발견 및 수정**: `docs/TRD.md` 4절 스키마에는 표지 이미지 URL을 저장할 컬럼이 없어 목록 카드에 표지를 보여줄 수 없었음. `books` 테이블에 `cover_url text` 컬럼을 추가(`supabase/schema.sql`, `docs/TRD.md` 갱신, 사용자가 Supabase SQL Editor에서 `ALTER TABLE` 실행 완료). `app/api/books/route.ts` POST가 `coverUrl`을 받아 저장하도록 수정, `app/page.tsx`가 알라딘 `cover` 값을 저장 시 함께 전송하도록 수정.

**완료 기준**: Step 5에서 저장한 책이 목록 화면에 올바른 카테고리 아래 표시된다. — 실제 표지 사진(`test-images/test1.jpg`)으로 `/api/identify → /api/aladin/search → /api/aladin/lookup → /api/books` 전체 체인 curl 호출 후 `GET /api/books`로 카테고리 그룹핑·`cover_url` 저장 확인, `/books` 페이지 셸 정상 로드(200) 확인. 브라우저 자동화 툴 미설치로 카드 클릭 등 인터랙션은 수동 확인 필요. 테스트로 저장된 레코드는 삭제해 원상복구.
**막히면**: 그룹핑 로직은 클라이언트에서 하지 말고 `GET /api/books`가 이미 정렬/그룹 가능한 형태로 내려주도록 API 쪽에서 처리(Step 4-4와 연계해 수정). — 실제로 이 원칙대로 진행.

## Step 7. 통합 검증 (End-to-End)

`docs/PRD.md` 6절 성공 기준 기준.

- [x] 7-1. 실제 표지 사진 업로드 → 몇 초 내 제목/저자 인식 → 알라딘 평점/리뷰/카테고리 표시 확인 — `test-images/test1.jpg`로 `/api/identify → /api/aladin/search → /api/aladin/lookup` curl 체인 실행, 총 3초 내 완료. 결과: 제목/저자/평점(8.1)/카테고리/리뷰건수(136) 모두 정상 반환.
- [x] 7-2. 새로고침 후에도 목록에서 방금 저장한 책이 보이는지 확인 — `/api/books POST`로 저장 후 별도의 새 `GET /api/books` 호출(새로고침과 동일하게 클라이언트가 매번 서버에서 새로 불러오는 구조)로 저장된 책이 그대로 조회됨을 확인.
- [x] 7-3. 목록에서 카테고리별 구분이 정확한지 확인 — 서로 다른 카테고리의 책 2권("경제경영>재테크/투자" / "소설/시/희곡>판타지/환상문학")을 저장 후 `GET /api/books`에서 두 카테고리로 정확히 분리되어 반환됨을 확인.
- [x] 7-4. 인식 실패/알라딘 매칭 실패 케이스를 의도적으로 유발해 에러 안내가 뜨는지 확인 — (a) 글자 없는 단색 이미지 업로드 → `/api/identify`가 422 + "표지를 인식하지 못했어요, 다시 시도해주세요" 반환, (b) 존재할 수 없는 무작위 문자열로 검색 → `/api/aladin/search`가 404 + "알라딘에서 이 책을 찾지 못했어요" 반환, (c) 1x1 픽셀 등 비정상 이미지로 Anthropic API 자체 오류 유발 → 500 + "일시적인 오류가 발생했어요, 다시 시도해주세요" 반환. 3가지 모두 `docs/TRD.md` 6절 문구와 정확히 일치.
- [x] 7-5. `docs/UXUI.md` 대비 실제 화면 스타일(모노톤, 무그라데이션) 최종 대조 — `grep -rn "bg-gradient|backdrop-blur|dark:"` 및 `neutral`/`zinc`/`red-600`/`red-200`(UXUI 4절 에러 카드 테두리 스펙에 명시적으로 허용) 외 유채색 클래스 검색 모두 위반 없음 확인. `NEXT_PUBLIC_*` 외 서버 전용 키가 `app/`(클라이언트 컴포넌트)에 노출되지 않음도 재확인. 브라우저 자동화 툴 미설치로 실제 스크린샷 대조는 하지 못함 — 사용자가 브라우저로 직접 열어 최종 확인 필요.

**완료 기준**: PRD 성공 기준 4개 항목 모두 통과. — API 레벨로 4개 항목 모두 통과 확인, 테스트로 저장된 레코드는 모두 삭제해 원상복구.
**막히면**: 특정 항목만 반복 실패하면 해당 Step으로 돌아가 원인 파일을 좁혀 수정 후 이 스텝부터 재검증.

**알려진 제약**: 브라우저 자동화 도구(Playwright 등)가 이 환경에 설치되어 있지 않아 실제 클릭 인터랙션(드래그앤드롭, 카드 클릭 전환 등)과 시각적 스크린샷 대조는 API/코드 레벨 검증으로 대체함. 사용자가 실제 브라우저에서 한 번 훑어보는 것을 권장.

## Step 8. 마무리

- [x] 8-1. README에 로컬 실행 방법(`.env.local` 설정 포함) 정리 — `create-next-app` 기본 README를 프로젝트 전용으로 재작성(외부 서비스 키 발급 안내, `.env.local` 설정, Supabase 스키마 실행, 사용 흐름, 알려진 제약 포함)
- [x] 8-2. `docs/TRD.md` 7절 "추후 검토 항목"과 실제 구현 범위가 어긋나지 않았는지 최종 대조 — 5개 항목(GCP OCR 폴백/교보·YES24 스크래핑/후보 선택 UI/자체 재분류/Supabase Auth) 모두 코드베이스에 grep으로 흔적 없음을 확인, `CLAUDE.md` 금지 목록과 정확히 일치. 어긋남 없음.
- [x] 8-3. 남은 이슈/알려진 제약 사항 정리 — README "알려진 제약" 절에 정리: 무인증 단일 사용자, 업로드 이미지 파일 자체는 미저장(알라딘 표지 URL만 저장), 절판/희귀 도서 매칭 실패 가능성. 추가로 이 프로젝트 진행 중 발견한 제약: 브라우저 자동화 도구 미설치로 실제 클릭 인터랙션/시각 대조는 API·코드 레벨 검증으로 대체(Step 5, 7 참고), 알라딘이 리뷰 원문을 제공하지 않아 리뷰는 집계 통계만 표시(Step 3 발견).

---

## Step 9. Phase 2 — 인증 및 멀티유저 (Supabase Auth)

`docs/PRD.md` "Phase 2 — 인증 및 멀티유저" 스코프, `docs/TRD.md` 2.4/4.1/4.2절, `docs/UXUI.md` 5-3/5A절 기준.

- [x] 9-1. Supabase 프로젝트에서 이메일 확인(Confirm email) 옵션 끄기(가입 즉시 로그인), `NEXT_PUBLIC_SUPABASE_ANON_KEY` 발급 후 로컬 `.env.local`/Vercel 환경변수에 등록 — 사용자가 Authentication > Sign In / Providers > Email에서 "Confirm sign up" 끄고, 새 API 키 체계의 publishable key를 `NEXT_PUBLIC_SUPABASE_ANON_KEY`로 등록 완료
- [x] 9-2. `@supabase/ssr` 설치, `lib/supabase/server.ts`(사용자 세션 기반, RLS 적용) / `lib/supabase/client.ts`(브라우저용) 작성, `middleware.ts`로 세션 갱신 — 작성 완료
- [x] 9-3. `books` 테이블 RLS 활성화 + 정책 추가 (`docs/TRD.md` 4.1절 SQL 그대로 Supabase SQL Editor에서 실행) — 사용자가 SQL Editor에서 실행 완료, `supabase/schema.sql`에도 반영
- [x] 9-4. `app/login/page.tsx`, `app/signup/page.tsx` 구현 (UXUI 5A 와이어프레임, 이메일/비밀번호 폼, neutral/zinc 톤) — `components/AuthForm.tsx` 공용 컴포넌트로 구현
- [x] 9-5. 로그아웃 라우트(`app/api/auth/logout/route.ts`) + `TopNav`에 로그인 상태에 따라 "로그인" ↔ "로그아웃" 표시 — `components/TopNav.tsx`로 공용화, 기존 `app/page.tsx`/`app/books/page.tsx` 내부 인라인 TopNav 제거하고 교체
- [x] 9-6. `app/api/books/route.ts`를 Service Role Key 대신 사용자 세션 클라이언트로 전환 — POST는 비로그인 시 401, GET은 RLS로 본인 책만 반환되는지 확인 — curl로 비로그인 401 확인, 테스트 스크립트로 두 계정 간 RLS 격리 확인(아래 9-10 참고)
- [x] 9-7. `app/page.tsx` 결과 화면: 로그인 여부에 따라 "저장됨" 표시 또는 "로그인하면 저장돼요" 배너로 분기 (비로그인 시 `/api/books` POST 호출 자체를 생략) — 완료, 비로그인 시 교보/YES24 링크는 클라이언트에서 직접 생성(`buildSearchUrls`)
- [x] 9-8. `app/books/page.tsx`: 비로그인 접근 시 UXUI 5-3 "로그인 필요" 안내 표시 — `GET /api/books`의 401 응답을 구분해서 안내 화면 렌더링
- [x] 9-9. 레거시 데이터 마이그레이션: 본인 첫 계정 가입 후 `docs/TRD.md` 4.2절 SQL로 `user_id IS NULL` 레코드 귀속 (1회성, 사용자 직접 실행) — 사용자가 본인 계정(admin@test.com) UUID로 실행 완료, 레거시 13건 귀속 확인
- [x] 9-10. 통합 검증: (a) 비로그인으로 식별→결과까지 확인, 저장 안 됨 확인 (b) 회원가입→로그인 후 동일 플로우로 저장됨 확인 (c) 두 번째 테스트 계정으로 로그인해 첫 계정의 책이 안 보이는지(RLS) 확인 (d) 로그아웃 후 `/books` 접근 시 로그인 안내 확인 — (a)(b)(d)는 사용자가 브라우저로 직접 확인, (c)는 브라우저 자동화 도구 미설치로 `@supabase/supabase-js`를 이용한 임시 스크립트로 두 테스트 계정을 만들어 RLS SELECT/INSERT 정책이 실제로 격리되는지 확인(테스트 계정·데이터는 확인 후 모두 삭제)

**완료 기준**: 비로그인 사용자는 식별/결과까지 자유롭게 쓰되 저장은 안 되고, 로그인 사용자는 본인 책만 저장·조회되며 서로 다른 계정 간 데이터가 섞이지 않는다. — 확인 완료.
**막히면**: RLS 정책이 의도대로 안 걸리면 `lib/supabase/server.ts`가 실제로 anon key + 사용자 JWT로 클라이언트를 만들고 있는지(Service Role Key를 실수로 계속 쓰고 있지 않은지) 먼저 확인한다.

---

## Step 10. Phase 3 — 구매 판단 태그 및 목록 개선

`docs/PRD.md` "Phase 3 — 구매 판단 태그" 스코프, `docs/TRD.md` 4절 기준.

- [x] 10-1. 같은 책(ISBN) 재스캔 시 새 행 대신 기존 행 갱신 — `(user_id, isbn)` unique 제약 + `POST /api/books` upsert 전환, `updated_at` 갱신
- [x] 10-2. 목록 화면에 책 삭제 기능 — `DELETE /api/books/[id]` 라우트 + 그리드 카드 × 버튼(확인 후 삭제)
- [x] 10-3. 조회일 표시 — `ViewedDate` 컴포넌트로 목록/상세 화면에 `updated_at` 기준 "OOOO.OO.OO 조회" 표시
- [x] 10-4. 카테고리 표시 단순화 — 알라딘 categoryName 리프를 한 단계 위로 줄여서 그룹핑(`lib/category.ts`), 자체 재분류가 아니라 알라딘 계층에서 한 단계를 고르는 것
- [x] 10-5. 목록 화면 필터/정렬 — 검색(제목·저자), 카테고리, 조회 기간(달력 범위 선택 `DateRangePicker`), 정렬(최근/평점/제목 세그먼트 버튼) — 클라이언트에서 이미 받은 전체 목록을 필터링(서버 API 변경 없음). 평점 최소값 슬라이더는 "평점 높은순" 정렬과 역할이 겹쳐 제거. 카테고리는 섹션 그룹핑으로 유지하되 정렬 기준에 따라 섹션 순서도 같이 바뀌도록 개선(`sortGroups`)
- [x] 10-6. `status` 컬럼 추가(`사고싶음`/`패스` 2단계, 기본값 `wishlist`) — `supabase/schema.sql`에 마이그레이션 SQL 작성 완료. 최초엔 `wishlist`/`bought`/`passed` 3단계였으나 "구매완료" 개념 제거 요청으로 2단계로 축소, 기존 `bought` 데이터는 `wishlist`로 되돌리는 마이그레이션 포함 — 사용자가 SQL Editor에서 실행 필요
- [x] 10-7. `PATCH /api/books/[id]` 라우트: `status`만 변경, 본인 소유만 허용(기존 UPDATE RLS 정책 재사용)
- [x] 10-8. 목록 카드 + 상세 화면에 상태 변경 버튼(2단 토글, 모달 없이 원터치) 추가 — `components/StatusToggle.tsx`
- [x] 10-9. 목록 상단에 "상태별 보기" 탭(전체/사고싶음/패스, 개수 표시) 추가 — 원래 필터 바 셀렉트로 시작했으나 더 직관적인 상단 탭 버튼으로 변경
- [ ] 10-10. 통합 검증: 저장 시 기본값 `wishlist` 확인 → 상태 변경 후 새로고침해도 유지되는지 → 상태 필터가 정확히 걸리는지 → 재스캔(upsert) 시 기존에 바꿔둔 status가 초기화되지 않는지 확인 — status 컬럼 마이그레이션 SQL 실행 후 진행 예정

**완료 기준**: 저장된 책마다 상태를 원터치로 바꿀 수 있고, 상태별로 필터링해서 볼 수 있으며, 재스캔해도 상태가 리셋되지 않는다.
**막히면**: PATCH가 404/403이면 RLS UPDATE 정책(`본인 책만 수정`)이 실제로 적용됐는지, `lib/supabase/server.ts` 세션 클라이언트를 쓰고 있는지 먼저 확인한다.

---

## 현재 상태 메모

- 프로젝트 루트: `/Users/mok/projects_2607/book-cover-review` (이미 git 저장소, `main` 브랜치에 기획 문서 커밋 존재 — Step 0 스캐폴딩 결과는 아직 커밋 전, 사용자 확인 후 커밋 예정)
- Step 0 완료: Next.js 16(App Router, TS) + Tailwind v4 + `@supabase/supabase-js` + `@anthropic-ai/sdk` 설치, `.env.example` 작성, lint/dev 서버 확인 완료
- Step 1(외부 서비스 키 발급)은 사용자만 할 수 있는 작업 — 다음 단계로 진행 필요
