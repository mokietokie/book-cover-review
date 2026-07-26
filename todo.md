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

- [ ] 0-1. Next.js(App Router, TypeScript) 프로젝트 초기화 (`create-next-app`)
- [ ] 0-2. Tailwind CSS 설정 확인 (App Router 템플릿에 기본 포함되는지 확인, `docs/UXUI.md` 0절 팔레트를 `tailwind.config` 또는 CSS 변수에 반영할지 검토 — 기본 Tailwind 그레이스케일 토큰 그대로 써도 무방하므로 커스텀 설정은 최소화)
- [ ] 0-3. `@supabase/supabase-js`, `@anthropic-ai/sdk` 설치
- [ ] 0-4. `.env.example` 작성 (`ALADIN_TTBKEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — 실제 값은 `.env.local`에 사용자가 채움
- [ ] 0-5. 기본 lint/format 동작 확인 (`npm run lint`)

**완료 기준**: `npm run dev`로 기본 Next.js 페이지가 뜬다.
**막히면**: 버전 충돌/피어디펜던시 에러는 `package.json` 버전 고정 후 재설치로 해결.

## Step 1. 외부 서비스 준비 (사용자 조치 필요 — 블로킹 가능 구간)

- [ ] 1-1. Supabase 프로젝트 생성 및 `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 발급 → `.env.local`에 입력 **(사용자)**
- [ ] 1-2. 알라딘 TTBKey 발급(알라딘 회원가입 후 Open API 신청) → `.env.local`에 입력 **(사용자)**
- [ ] 1-3. Anthropic API 키 발급 → `.env.local`에 입력 **(사용자)**

**완료 기준**: `.env.local`에 4개 값이 모두 채워져 있다.
**막히면**: 이 스텝은 자동화 불가 — 값이 없으면 Step 2~4는 코드까지만 작성하고 실제 호출 검증은 값이 채워진 뒤로 미룬다. Step 0, 5(UI 정적 부분)는 키 없이도 진행 가능하므로 먼저 처리.

## Step 2. Supabase 스키마 생성

- [ ] 2-1. `docs/TRD.md` 4절 스키마대로 `books` 테이블 생성 SQL 작성 (`supabase/schema.sql` 등에 보관)
- [ ] 2-2. Supabase SQL Editor(또는 CLI)로 실제 테이블 생성
- [ ] 2-3. `lib/supabase.ts` 서버 전용 클라이언트 작성 (Service Role Key 사용, 클라이언트 번들에 노출되지 않도록 `"server-only"` 처리)

**완료 기준**: Supabase 대시보드에서 `books` 테이블과 전체 컬럼이 스키마대로 보인다.
**막히면**: RLS가 기본 활성화되어 쓰기가 막히면, 스켈레톤 단계는 인증이 없으므로 Service Role Key 경로만 쓰는지 확인(Service Role은 RLS 우회). 우회가 안 되면 해당 테이블 RLS를 임시 비활성화.

## Step 3. 외부 API 연동 레이어 (`lib/`)

- [ ] 3-1. `lib/vision.ts`: 이미지 → Anthropic Messages API 호출 → `{ title, author }` JSON 추출 함수. 실패/빈 값 시 명확한 에러 타입 반환.
- [ ] 3-2. `lib/aladin.ts`: `searchBooks(query)` (ItemSearch 호출, 후보 배열 반환) / `lookupBook(isbn)` (ItemLookUp + `OptResult=reviewList` 호출, 상세+리뷰+카테고리+평점 파싱) 두 함수 작성.
- [ ] 3-3. 위 두 파일에 대해 실제 키가 있다면 임시 스크립트(`scripts/` 또는 `.test`)로 단독 호출해 응답 구조를 확인하고, `docs/TRD.md`에 적힌 필드명과 실제 응답이 다르면 파싱 로직을 실제 응답 기준으로 맞춘다.

**완료 기준**: 샘플 제목("해리포터와 마법사의 돌" 등)으로 `searchBooks` → `lookupBook`을 호출했을 때 정상적으로 ISBN·카테고리·평점·리뷰가 반환된다.
**막히면**: 알라딘 API는 파라미터 오타(대소문자, `Version` 값)에 민감함 — 공식 문서 URL 포맷을 다시 대조. 401/403이면 TTBKey 미승인 상태일 수 있으니 알라딘 개발자센터에서 키 상태 확인 필요(사용자 조치).

## Step 4. API 라우트 (`app/api/`)

- [ ] 4-1. `app/api/identify/route.ts`: 업로드된 이미지를 받아 `lib/vision.ts` 호출, `{ title, author }` 반환. 인식 실패 시 에러 코드로 구분되게 응답.
- [ ] 4-2. `app/api/aladin/search/route.ts`: title/author 텍스트로 `lib/aladin.searchBooks` 호출, 최상위 1건 반환.
- [ ] 4-3. `app/api/aladin/lookup/route.ts`: ISBN으로 `lib/aladin.lookupBook` 호출, 상세 반환.
- [ ] 4-4. `app/api/books/route.ts`: `GET`(전체 목록, 카테고리별 그룹 가능하도록 정렬), `POST`(식별 결과 저장 — 이때 `kyobo_search_url`/`yes24_search_url`도 함께 생성해 저장) 구현.
- [ ] 4-5. 각 라우트에 대해 curl 또는 `fetch`로 수동 호출해 정상/에러 응답 확인.

**완료 기준**: 4개 라우트 모두 정상 케이스·실패 케이스(빈 값, 0건 검색 등)에서 `docs/TRD.md` 6절 에러 정책에 맞는 응답을 준다.
**막히면**: 이미지 업로드 바디 파싱(FormData vs base64) 이슈가 흔함 — Route Handler에서 `request.formData()` 사용 여부를 먼저 확정하고 프론트와 계약을 맞춘다.

## Step 5. 업로드 화면 (`app/page.tsx`)

`docs/UXUI.md` 1~4절 와이어프레임 기준.

- [ ] 5-1. Empty 상태: 드롭존 UI, 파일 선택 처리
- [ ] 5-2. Selected 상태: 미리보기, "다시 선택"/"이 책 식별하기" 버튼
- [ ] 5-3. 인식 중 상태: 3단계 체크리스트 UI + 실제 API 3연쇄 호출(`/api/identify` → `/api/aladin/search` → `/api/aladin/lookup`) 순차 연동, 완료 시 `/api/books POST`로 자동 저장
- [ ] 5-4. 결과 화면: 표지·평점·카테고리·리뷰 목록·저장 완료 표시·교보/YES24 링크·"다른 표지 업로드하기"
- [ ] 5-5. 에러 상태: 실패 지점별 문구 3종(인식 실패/검색 0건/일반 오류) 분기, "다시 시도"/"다른 사진 선택"
- [ ] 5-6. 모노톤 스타일 가이드(0절 팔레트) 준수 여부 셀프 체크 — 그라데이션/글래스모피즘 클래스가 안 쓰였는지 grep으로 확인

**완료 기준**: 실제 표지 사진 하나를 업로드해 Empty → Selected → 인식 중 → 결과까지 화면 전환이 매끄럽게 동작한다.
**막히면**: 상태 전환이 꼬이면 페이지 내부를 `idle | selected | identifying | result | error` 같은 단일 상태 머신으로 정리해서 버그를 좁힌다.

## Step 6. 목록 화면 (`app/books/page.tsx`)

`docs/UXUI.md` 5절 기준.

- [ ] 6-1. `GET /api/books` 결과를 `category_name` 기준으로 그룹핑해 섹션별 렌더링
- [ ] 6-2. 카드 그리드 반응형(`grid-cols-2 → sm:grid-cols-4 → lg:grid-cols-6`) 적용
- [ ] 6-3. Empty 상태(저장된 책 없음) UI
- [ ] 6-4. 카드 클릭 시 상세(결과 화면 레이아웃 재사용, 저장 배너 없이) 표시

**완료 기준**: Step 5에서 저장한 책이 목록 화면에 올바른 카테고리 아래 표시된다.
**막히면**: 그룹핑 로직은 클라이언트에서 하지 말고 `GET /api/books`가 이미 정렬/그룹 가능한 형태로 내려주도록 API 쪽에서 처리(Step 4-4와 연계해 수정).

## Step 7. 통합 검증 (End-to-End)

`docs/PRD.md` 6절 성공 기준 기준.

- [ ] 7-1. 실제 표지 사진 업로드 → 몇 초 내 제목/저자 인식 → 알라딘 평점/리뷰/카테고리 표시 확인
- [ ] 7-2. 새로고침 후에도 목록에서 방금 저장한 책이 보이는지 확인
- [ ] 7-3. 목록에서 카테고리별 구분이 정확한지 확인
- [ ] 7-4. 인식 실패/알라딘 매칭 실패 케이스를 의도적으로 유발(글자가 안 보이는 이미지 등)해 에러 안내가 뜨는지 확인
- [ ] 7-5. `docs/UXUI.md` 대비 실제 화면 스타일(모노톤, 무그라데이션) 최종 스크린샷 대조

**완료 기준**: PRD 성공 기준 4개 항목 모두 통과.
**막히면**: 특정 항목만 반복 실패하면 해당 Step으로 돌아가 원인 파일을 좁혀 수정 후 이 스텝부터 재검증.

## Step 8. 마무리

- [ ] 8-1. README에 로컬 실행 방법(`.env.local` 설정 포함) 정리
- [ ] 8-2. `docs/TRD.md` 7절 "추후 검토 항목"과 실제 구현 범위가 어긋나지 않았는지 최종 대조
- [ ] 8-3. 남은 이슈/알려진 제약 사항 정리

---

## 현재 상태 메모

- 프로젝트 루트: `/Users/mok/projects_2607/book-cover-review` (아직 git 저장소 아님 — 초기 커밋은 Step 0 이후 사용자 확인받고 진행)
- Step 1(외부 서비스 키 발급)은 사용자만 할 수 있는 작업이라 병행: 키가 없어도 Step 0, 5(정적 UI 부분)는 먼저 진행 가능
