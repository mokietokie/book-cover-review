# 표지리뷰

책표지 사진을 업로드하면 Vision LLM으로 제목/저자를 인식하고, 알라딘 Open API에서 평점·리뷰·카테고리를 조회해 보여주는 개인용 웹앱 스켈레톤 MVP.

- 상세 기획/설계: [docs/PRD.md](./docs/PRD.md), [docs/TRD.md](./docs/TRD.md), [docs/UXUI.md](./docs/UXUI.md)
- 스택: Next.js(App Router, TS) + Tailwind + Supabase(Postgres) + 알라딘 Open API + Anthropic Vision LLM

## 로컬 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 외부 서비스 준비 (사용자 조치 필요)

아래 3곳에서 키를 발급받아야 한다.

- **Supabase**: [supabase.com](https://supabase.com)에서 프로젝트 생성 후 Project Settings → API에서 프로젝트 URL과 Service Role Key(새 API 키 체계라면 secret key)를 확인
- **알라딘 Open API**: [알라딘 Open API 센터](https://blog.aladin.co.kr/openapi/)에서 회원가입 후 TTBKey 신청
- **Anthropic API**: [console.anthropic.com](https://console.anthropic.com)에서 API 키 발급

### 3. 환경 변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 값을 채운다.

```bash
cp .env.example .env.local
```

```
ALADIN_TTBKEY=발급받은_TTBKey
ANTHROPIC_API_KEY=발급받은_Anthropic_키
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=발급받은_Service_Role_Key
```

`ALADIN_TTBKEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`는 서버 사이드에서만 사용되며 클라이언트 번들에 노출되지 않는다.

### 4. Supabase 테이블 생성

Supabase 대시보드 → SQL Editor에서 [supabase/schema.sql](./supabase/schema.sql) 내용을 실행해 `books` 테이블을 만든다.

### 5. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 업로드 화면을, [http://localhost:3000/books](http://localhost:3000/books)에서 저장된 책 목록을 확인할 수 있다.

## 사용 흐름

```
표지 사진 업로드 → Vision LLM(제목/저자 추출) → 알라딘 ItemSearch(ISBN) → ItemLookUp(평점/카테고리)
→ Supabase 저장 → 결과 화면 표시 → 목록 화면에서 카테고리별로 확인
```

- 알라딘 검색 결과가 여러 건이어도 최상위 1건을 자동 채택한다(후보 선택 UI 없음).
- 교보문고/YES24는 검색 결과 페이지로 이동하는 링크만 제공한다(스크래핑 없음).
- 알라딘이 리뷰 원문을 제공하지 않는 경우가 많아, 리뷰는 평점 건수 등 집계 통계만 저장·표시한다.

## 알려진 제약

- 로그인/인증 없는 단일 사용자 스켈레톤이다.
- 업로드한 이미지 파일 자체는 저장하지 않는다(알라딘 표지 이미지 URL만 저장).
- 알라딘 API가 커버하지 못하는 절판/희귀 도서는 매칭에 실패할 수 있다.
