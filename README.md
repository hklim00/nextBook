# 다음책

> 검색하지 않았을 책을 발견하는 곳.

`다음책`은 취향 적중률이나 판매 순위가 아니라, 검수된 맥락과 적절한 우연을 통해 낯선 책을 만나는 모바일 우선 MVP입니다. 개인화는 읽은 책·관심 없는 책·최근 본 책을 치우고 같은 저자·출판사·분류의 연속 노출을 줄이는 데만 사용합니다. 운영 중 AI/LLM API, 광고, 판매량 기반 추천은 사용하지 않습니다.

현재 책·인물·출처는 전부 **가상 Mock 데이터**입니다. 실제 인물의 추천 사실로 오인할 관계는 포함하지 않습니다.

## 기술 스택

- Astro 7 + TypeScript, React islands
- Tailwind CSS 4와 전역 디자인 토큰
- Cloudflare Workers + D1
- Drizzle ORM / Drizzle Kit
- Vitest, ESLint, Prettier
- 브라우저 LocalStorage 기반 사용자 상태와 발견 이력

## 프로젝트 구조

```text
src/
├─ components/            Astro 표현 컴포넌트와 React islands
├─ data/mock.ts           외부 API 없이 실행되는 가상 카탈로그
├─ db/                    Drizzle 스키마와 생성된 D1 seed
├─ domain/                핵심 모델과 표시 라벨
├─ features/discovery/    제외·다양성 발견 규칙
├─ pages/                 발견, 상세, 서재, 인물, 출판사, 작가, admin
├─ providers/             Mock/Google Books 및 외부 adapter
├─ repositories/          LocalStorage 상태와 D1 검수 저장소
└─ styles/                공통 스타일
migrations/               D1 SQL migration
scripts/                  Mock에서 seed SQL 생성
```

주요 라우트는 `/`, `/discover/random`, `/book/[id]`, `/library`, `/person/[slug]`, `/publisher/[slug]`, `/author/[slug]`, `/admin`입니다.

## 로컬 실행

Node.js 22.22.3 이상을 권장합니다.

```bash
npm install
copy .env.example .env
npm run dev
```

`http://localhost:4321`에서 확인합니다. 사용자 화면은 D1 카탈로그만 사용하며, D1이 비어 있거나 연결되지 않으면 빈 상태를 표시합니다.

## D1 migration과 seed

```bash
npm run db:migrate:local
npm run db:seed:local
```

`db:seed:local`은 `src/data/mock.ts`에서 `src/db/seed.sql`을 다시 만든 뒤 로컬 D1에 적재합니다. 현재 seed에는 책 28권, 출판사 5개, 작가 24명, 인물 10명, 출처 15개, 언급 관계 56개, 컬렉션 5개가 있습니다. 기존 로컬 검수 데이터가 초기화되므로 개발 환경에서만 사용합니다.

스키마를 변경할 때는 새 migration을 추가한 뒤 아래 명령을 실행합니다.

```bash
npm run db:generate
npm run db:migrate:local
```

## 사용자 상태와 발견 규칙

`UserBookStateRepository`가 `want_to_read`, `read`, `not_interested`를 브라우저에 저장합니다. `LocalStorageDiscoveryHistoryRepository`는 최근 책·저자·출판사·분류를 각각 최대 8개 보관합니다. UI는 LocalStorage를 직접 알 필요가 없으므로 계정 기능 도입 시 repository 구현만 교체할 수 있습니다.

랜덤 발견은 다음 순서로 작동합니다.

1. `read`, `not_interested` 제외
2. 최근 본 책 제외
3. 같은 저자·출판사·분류가 연속 두 번 노출되면 해당 축을 임시 제외
4. 남은 후보에서 무작위 선택
5. 후보가 모두 최근 책이면 상태 제외만 유지한 채 순환

저장 장르를 강화하거나 취향을 예측하지 않습니다.

## Google Books 연동

`BookProvider`는 `searchBooks`, `getBookByISBN`, `getBookMetadata`를 정의합니다. `MockBookProvider`로 오프라인 UX를 테스트하고, `GoogleBooksProvider`는 관리자용 보조 메타데이터 후보를 정규화합니다. `BookMetadataService`는 ISBN의 저장본을 먼저 찾고, 없을 때만 provider를 호출한 뒤 누락 필드가 있으면 검수 필요 상태로 저장합니다.

Google Books 키는 선택 사항입니다. 할당량 관리가 필요할 때 `GOOGLE_BOOKS_API_KEY`를 서버 환경변수로 설정합니다. 브라우저에서 직접 호출하거나 사용자 요청마다 재조회하지 않습니다. Google Books 결과는 한국어 판본의 절대적 정답으로 취급하지 않습니다.

## 실제 도서 화면 노출

D1에 저장된 책은 홈의 카테고리 선반, 랜덤 발견, 상세, 서재, 작가와 출판사 페이지에서 동일한 레코드로 표시됩니다. `cover_url`이 있으면 실제 표지를 사용하고 없을 때만 색상 임시 표지를 사용합니다. 별도의 API 검색·수집 UI는 제공하지 않습니다.

### 매일 갱신되는 흐름

Cloudflare Cron Trigger가 매일 `18:00 UTC`(`03:00 KST`)에 `src/worker.ts`의 `scheduled()` handler를 실행합니다.

1. 정보나루에서 오늘의 우연·고전·비문학·출판사 후보 수집
2. 제목/부제, 대표 저자, 출간일, 분류와 표지 정규화
3. 책·작가·출판사를 D1에 upsert
4. 전체 수집이 성공했을 때만 일일 컬렉션 관계를 트랜잭션으로 교체
5. 실패하면 기존 컬렉션을 유지하고 `discovery_sync_runs`에 실패 기록
6. 사용자 요청은 외부 API를 호출하지 않고 D1만 조회

로컬에서는 개발 서버 실행 후 `http://127.0.0.1:4321/cdn-cgi/local/scheduled?format=json`을 요청해 scheduled handler를 시험할 수 있습니다. 동기화 결과는 `discovery_sync_runs`에서 확인합니다.

`books.metadata_source`는 `data4library`, `google_books`, `national_library`, `manual`, `mock`을 구분하고, `discovery_active`는 오늘 컬렉션에 포함된 도서인지 나타냅니다.

## 관리자 검수

`/admin`은 자동 컬렉션과 동기화 상태를 확인하고, 관리자 추천 카테고리를 생성한 뒤 정보나루에서 검색한 책을 추가하는 기능을 제공합니다. D1을 사용할 수 없으면 관리 쓰기는 비활성화됩니다. 공개 배포에서는 `/admin`과 `/api/admin/*`를 Cloudflare Access로 보호해야 합니다.

## 검사와 테스트

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run format:check
```

테스트는 사용자 상태 저장/교체/삭제, 최근 노출 저장, 읽음·관심 없음·최근 책 제외, 저자·출판사 반복 제한, 컬렉션 조회, 언급 관계와 상업 맥락, Google Books 정규화, API 없는 Mock Provider를 다룹니다.

## Cloudflare 배포

1. `npx wrangler login`
2. `npx wrangler d1 create next-read-db`
3. 반환된 ID를 `wrangler.jsonc`의 `database_id`에 입력
4. `npx wrangler d1 migrations apply next-read-db --remote`
5. 운영용 검수 데이터 적재
6. 필요한 키를 `wrangler secret put GOOGLE_BOOKS_API_KEY`로 등록
7. `npm run deploy`

## Free Tier 고려사항

- 사용자별 상태와 노출 이력은 D1에 쓰지 않습니다.
- 검수·수집 시에만 외부 provider를 호출하고 저장본을 재사용합니다.
- 관계, 인물, 컬렉션, 저자, 출판사 조회용 인덱스를 migration에 포함합니다.
- 사용자 요청별 외부 API 호출은 없으며, 하루 한 번의 Cron 수집만 실행합니다.
- AI/LLM, 유료 서점 데이터, 구매·광고 기능이 없습니다.
- 정적 자산은 Cloudflare Assets 캐시를 사용합니다.

## 현재 Mock과 다음 단계

- 책·인물·출처와 표지는 가상 데이터/색상 표지입니다.
- Google Books adapter와 정규화 서비스는 구현됐지만 관리자 수집 버튼과 D1 metadata store 연결은 다음 단계입니다.
- 실제 운영 전 검증된 국내 도서 메타데이터와 원출처를 입력하고 Cloudflare Access를 설정해야 합니다.
- PWA manifest는 준비됐지만 오프라인 service worker는 아직 없습니다.
