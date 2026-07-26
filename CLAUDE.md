# CLAUDE.md — 이 프로젝트의 헌법

책표지 사진을 업로드하면 알라딘 리뷰/평점/카테고리를 보여주는 개인용 Next.js 웹앱의 스켈레톤 MVP.

**항상 먼저 참고**: `docs/PRD.md`(범위/성공기준), `docs/TRD.md`(아키텍처/API 스펙/DB 스키마), `docs/UXUI.md`(화면별 와이어프레임/스타일 가이드), `todo.md`(단계별 작업 및 완료 기준). 이 문서들과 충돌하는 판단이 들면 이 4개 문서가 항상 우선.

## 꼭 해야 하는 것

- `todo.md`의 Step 순서대로 진행하고, 완료한 항목은 체크박스를 갱신한다.
- 스택: Next.js(App Router, TS) + Tailwind + Supabase(Postgres) + 알라딘 Open API + Vision LLM(Anthropic).
- 플로우는 반드시 `사진 → Vision LLM(제목/저자 추출) → 알라딘 ItemSearch(ISBN) → ItemLookUp(OptResult=reviewList)` 순서를 따른다.
- 사진 입력은 파일 선택/드래그앤드롭 외에, 모바일에서는 `<input capture="environment">`로 카메라 즉시 촬영도 지원한다(별도 라이브러리/`getUserMedia` 없이, 촬영 결과는 기존 파일 선택과 동일하게 처리).
- 알라딘 검색 결과가 여러 건이어도 **최상위 1건을 자동 채택**한다.
- 카테고리는 알라딘 `categoryName`을 그대로 쓴다.
- Supabase `books` 테이블은 `docs/TRD.md` 4절 스키마를 그대로 따르고, `user_id`는 nullable로 두되 값은 채우지 않는다.
- 교보문고/YES24는 검색 결과 페이지로 이동하는 **링크만** 제공한다.
- 디자인은 Tailwind `neutral`/`zinc` 그레이스케일 단색만 사용한다(에러 텍스트에 한해 `red-600` 허용).
- `ALADIN_TTBKEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`는 서버 사이드에서만 사용한다.
- 에러는 `docs/TRD.md` 6절의 3가지 케이스(인식 실패/검색 0건/일반 오류) 문구를 그대로 사용한다.
- 막히면 `todo.md`의 "실패 시 공통 대응 원칙"에 따라 원인을 좁혀 스스로 해결한다.

## 하지 말아야 하는 것

- 로그인/인증 기능 구현 금지 (스켈레톤은 무인증 단일 사용자).
- 교보문고/YES24 스크래핑 금지 (공식 리뷰 API 없음, 링크만).
- 검색 결과 다중 후보 선택 UI 금지 (자동 1건 채택).
- 알라딘 카테고리를 자체 LLM으로 재분류하는 로직 금지.
- GCP OCR 등 보조 인식기 추가 금지 (Vision LLM 단일 경로만).
- Tailwind 그라데이션(`bg-gradient-*`)·glassmorphism(반투명+블러) 금지.
- 다크모드 구현 금지.
- `NEXT_PUBLIC_*` 이외의 키를 클라이언트 번들에 노출 금지.
- `docs/PRD.md` Out of Scope 항목을 임의로 구현 범위에 끌어들이지 않는다 — 애매하면 제외 쪽으로 판단.
