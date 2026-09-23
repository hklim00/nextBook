import type { ExternalBook, LoanRankingBook, WeightedKeyword } from '../../domain/models';
import type { LibraryProvider } from '../../providers/types';

export interface CuratedBook extends ExternalBook {
  reason: string;
}

export interface Data4Category {
  slug: string;
  title: string;
  description: string;
  basis: string;
  books: CuratedBook[];
  alternatives: CuratedBook[];
}

export interface PublisherShelf {
  publisher: string;
  description: string;
  books: CuratedBook[];
}

export interface Data4CategoryFeed {
  generatedAt: string;
  discoveryDate: string;
  categories: Data4Category[];
  publisherShelves: PublisherShelf[];
  publisherAlternatives: PublisherShelf[];
  warnings: string[];
  source: 'data4library';
}

const ADULT_ADDITION_CODES = new Set(['0', '1', '2', '9']);

interface ClassicWork {
  title: string;
  aliases?: string[];
  author: string;
  reason: string;
}

// 고전 여부는 출간 연도나 대출량이 아니라 작품 단위의 편집 목록으로 결정한다.
// 정보나루는 이 작품들의 국내 유통 판본을 찾는 용도로만 사용한다.
const CLASSIC_WORKS: ClassicWork[] = [
  { title: '일리아스', author: '호메로스', reason: '서양 서사문학의 오랜 출발점' },
  { title: '오디세이아', author: '호메로스', reason: '귀환과 모험의 원형이 된 서사시' },
  { title: '신곡', author: '단테', reason: '중세와 근대를 잇는 거대한 상상력의 유산' },
  { title: '돈키호테', author: '세르반테스', reason: '근대소설의 문을 연 풍자와 모험의 고전' },
  { title: '햄릿', author: '셰익스피어', reason: '인간의 망설임과 책임을 끝없이 되묻게 하는 비극' },
  {
    title: '리어 왕',
    aliases: ['리어왕'],
    author: '셰익스피어',
    reason: '권력과 가족, 인간의 취약함을 파고든 비극',
  },
  { title: '오만과 편견', author: '제인 오스틴', reason: '사랑과 계급을 예리하게 관찰한 소설' },
  {
    title: '모비 딕',
    aliases: ['모비딕'],
    author: '허먼 멜빌',
    reason: '집착과 자연, 인간의 한계를 탐색한 대작',
  },
  { title: '죄와 벌', author: '도스토옙스키', reason: '죄책감과 구원의 문제를 깊이 밀어붙인 소설' },
  {
    title: '카라마조프가의 형제들',
    aliases: ['카라마조프의 형제들'],
    author: '도스토옙스키',
    reason: '신앙과 자유, 책임을 둘러싼 사유의 고전',
  },
  { title: '전쟁과 평화', author: '톨스토이', reason: '역사 속 개인의 삶을 장대하게 그린 소설' },
  {
    title: '안나 카레니나',
    author: '톨스토이',
    reason: '사랑과 사회적 규범의 충돌을 섬세하게 그린 소설',
  },
  { title: '마담 보바리', author: '플로베르', reason: '욕망과 현실의 틈을 정교하게 포착한 소설' },
  {
    title: '레 미제라블',
    aliases: ['레미제라블'],
    author: '빅토르 위고',
    reason: '정의와 자비, 사회의 책임을 묻는 대작',
  },
  { title: '위대한 유산', author: '찰스 디킨스', reason: '성장과 계급, 진정한 가치에 관한 소설' },
  { title: '파우스트', author: '괴테', reason: '지식과 욕망, 구원을 탐구한 세계문학의 고전' },
  { title: '변신', author: '카프카', reason: '소외된 인간의 조건을 압축해 보여주는 소설' },
  { title: '심판', author: '카프카', reason: '이해할 수 없는 권력과 불안을 그린 현대의 고전' },
  { title: '마의 산', author: '토마스 만', reason: '시간과 질병, 유럽 문명의 위기를 담은 소설' },
  {
    title: '등대로',
    author: '버지니아 울프',
    reason: '의식과 시간의 흐름을 새롭게 펼친 모더니즘 소설',
  },
  { title: '1984', author: '조지 오웰', reason: '감시와 언어, 권력의 위험을 경고하는 소설' },
  {
    title: '멋진 신세계',
    author: '올더스 헉슬리',
    reason: '통제된 행복과 인간다움의 의미를 묻는 소설',
  },
  { title: '이방인', author: '알베르 카뮈', reason: '부조리한 세계와 인간의 태도를 응시한 소설' },
  {
    title: '백년의 고독',
    author: '가브리엘 가르시아 마르케스',
    reason: '역사와 신화를 한 가문의 시간에 담아낸 소설',
  },
  { title: '토지', author: '박경리', reason: '한국 근현대사의 삶을 거대한 서사로 남긴 작품' },
  {
    title: '광장',
    author: '최인훈',
    reason: '분단과 이념 사이 개인의 자리를 묻는 한국문학의 고전',
  },
  { title: '삼대', author: '염상섭', reason: '식민지 시대 가족과 세대의 균열을 그린 소설' },
  {
    title: '난장이가 쏘아올린 작은 공',
    author: '조세희',
    reason: '산업화의 그늘과 존엄의 문제를 새긴 연작소설',
  },
];

const DISCOVERY_PAGE_COUNT = 2;

const ECONOMY_WORDS = ['경제', '금융', '투자', '경영', '자본', '시장', '재테크', '돈'];
const MONTHLY_KEYWORD_EXCLUSIONS = new Set([
  '소설',
  '도서',
  '책',
  '한국',
  '문학',
  '작가',
  '이야기',
]);
const AUTOMATIC_COLLECTION_SLUGS = [
  'rising-economy',
  'philosophy-keywords',
  'monthly-keyword',
] as const;

const REMOVED_AUTOMATIC_COLLECTION_SLUGS = new Set(['data-career-starter', 'startup-keywords']);

const DATA_CAREER_TOPIC_WORDS = [
  '데이터',
  '데이터분석',
  '통계',
  '빅데이터',
  '인공지능',
  '머신러닝',
  '파이썬',
  'sql',
  '시각화',
];

export const isAdultCandidate = (book: ExternalBook): boolean => {
  const code = book.additionSymbol?.replace(/\D/g, '').charAt(0);
  return Boolean(code && ADULT_ADDITION_CODES.has(code));
};

// Every discovery source must pass through this gate before ranking, matching,
// keyword scoring, diversity selection, or metadata enrichment.
export const adultCandidates = <T extends ExternalBook>(books: T[]): T[] =>
  books.filter(isAdultCandidate);

const majorKdc = (book: ExternalBook): string => book.kdc?.charAt(0) || 'unknown';

const stableHash = (value: string): number => {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seoulDateParts = (date: Date) => {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    date: `${values.year}-${values.month}-${values.day}`,
  };
};

const shiftedDate = (year: number, month: number, day: number, offset: number): string => {
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return date.toISOString().slice(0, 10);
};

const uniqueByIsbn = <T extends ExternalBook>(books: T[]): T[] => [
  ...new Map(books.map((book) => [book.isbn13, book])).values(),
];

const withoutRanking = (book: LoanRankingBook): ExternalBook => ({
  isbn13: book.isbn13,
  title: book.title,
  subtitle: book.subtitle,
  author: book.author,
  publisher: book.publisher,
  publishedAt: book.publishedAt,
  additionSymbol: book.additionSymbol,
  description: book.description,
  pageCount: book.pageCount,
  kdc: book.kdc,
  ddc: book.ddc,
  subject: book.subject,
  coverUrl: book.coverUrl,
  detailUrl: book.detailUrl,
  source: book.source,
});

const orderedForDay = <T extends ExternalBook>(books: T[], seed: string): T[] =>
  [...books].sort((a, b) => stableHash(`${seed}:${a.isbn13}`) - stableHash(`${seed}:${b.isbn13}`));

const normalizedText = (value: string): string =>
  value.toLocaleLowerCase('ko-KR').replace(/[^0-9a-z가-힣]/g, '');

const keywordMatches = (left: string, right: string): boolean => {
  const a = normalizedText(left);
  const b = normalizedText(right);
  if (!a || !b) return false;
  if (a === b) return true;
  return Math.min(a.length, b.length) >= 2 && (a.includes(b) || b.includes(a));
};

const matchesClassicWork = (work: ClassicWork, book: ExternalBook): boolean => {
  const titles = [work.title, ...(work.aliases ?? [])].map(normalizedText);
  const authorTokens = work.author.split(/\s+/).map(normalizedText).filter(Boolean);
  const title = normalizedText(book.title);
  const author = normalizedText(book.author);
  return (
    titles.some((classicTitle) => title.includes(classicTitle)) &&
    authorTokens.some((token) => author.includes(token))
  );
};

const findClassicEdition = (work: ClassicWork, books: ExternalBook[]): ExternalBook | undefined => {
  const titles = [work.title, ...(work.aliases ?? [])].map(normalizedText);
  const authorTokens = work.author.split(/\s+/).map(normalizedText).filter(Boolean);

  return books
    .filter((book) => {
      return matchesClassicWork(work, book) && isAdultCandidate(book);
    })
    .sort((a, b) => {
      const score = (book: ExternalBook) => {
        const title = normalizedText(book.title);
        const author = normalizedText(book.author);
        return (
          (titles.includes(title) ? 8 : 0) +
          (authorTokens.some((token) => author.includes(token)) ? 4 : 0) +
          (book.coverUrl ? 2 : 0) +
          (book.description ? 1 : 0)
        );
      };
      return score(b) - score(a) || a.isbn13.localeCompare(b.isbn13);
    })[0];
};

const loadClassicEditions = async (
  provider: LibraryProvider,
  selectionSeed: string,
): Promise<{ books: CuratedBook[]; warning?: string }> => {
  const works = [...CLASSIC_WORKS].sort(
    (a, b) =>
      stableHash(`${selectionSeed}:classic:${a.title}`) -
      stableHash(`${selectionSeed}:classic:${b.title}`),
  );
  const requestedWorks = works.slice(0, 12);
  const results = await Promise.allSettled(
    requestedWorks.map((work) => provider.searchBooks(work.title, { pageSize: 20 })),
  );
  const candidates = results.flatMap((result, index) => {
    if (result.status === 'rejected') return [];
    const work = requestedWorks[index];
    const edition = work && findClassicEdition(work, adultCandidates(result.value));
    return edition && work ? [{ edition, work }] : [];
  });
  const books = candidates.map(({ edition, work }) => ({
    ...edition,
    reason: `${work.reason} · 오늘의 고전 목록에서 무작위로 선택`,
  }));

  return {
    books: uniqueByIsbn(books),
    warning: results.some((result) => result.status === 'rejected')
      ? '일부 고전 판본을 불러오지 못했습니다.'
      : undefined,
  };
};

const selectDiverse = (
  books: ExternalBook[],
  count: number,
  seed: string,
  excluded = new Set<string>(),
): ExternalBook[] => {
  const selected: ExternalBook[] = [];
  const publishers = new Map<string, number>();
  const authors = new Set<string>();
  const categories = new Map<string, number>();
  const ordered = orderedForDay(uniqueByIsbn(books), seed);

  const trySelect = (publisherLimit: number, categoryLimit: number) => {
    for (const book of ordered) {
      if (selected.length >= count) break;
      if (excluded.has(book.isbn13) || selected.some((item) => item.isbn13 === book.isbn13))
        continue;
      const publisher = book.publisher || 'unknown';
      const author = book.author || 'unknown';
      const category = majorKdc(book);
      if ((publishers.get(publisher) ?? 0) >= publisherLimit) continue;
      if (authors.has(author)) continue;
      if ((categories.get(category) ?? 0) >= categoryLimit) continue;
      selected.push(book);
      publishers.set(publisher, (publishers.get(publisher) ?? 0) + 1);
      authors.add(author);
      categories.set(category, (categories.get(category) ?? 0) + 1);
    }
  };

  trySelect(1, 2);
  trySelect(2, 3);
  return selected;
};

const withReason = (books: ExternalBook[], reason: (book: ExternalBook) => string): CuratedBook[] =>
  books.map((book) => ({ ...book, reason: reason(book) }));

const CHILD_FOCUSED_LIBRARY_WORDS = ['어린이', '아동', '유아', '학교', '초등', '중등', '고등'];

const detailAdultCandidates = async (
  provider: LibraryProvider,
  books: ExternalBook[],
  limit: number,
): Promise<ExternalBook[]> => {
  if (typeof provider.getBookDetail !== 'function') return adultCandidates(books).slice(0, limit);
  const selected: ExternalBook[] = [];
  for (const book of books) {
    if (selected.length >= limit) break;
    try {
      const detail = await provider.getBookDetail(book.isbn13);
      const enriched = detail
        ? {
            ...book,
            ...detail,
            registeredAt: book.registeredAt,
            description: detail.description?.trim() || book.description,
            coverUrl: detail.coverUrl || book.coverUrl,
          }
        : book;
      if (isAdultCandidate(enriched)) selected.push(enriched);
    } catch (error) {
      console.warn(`Discovery detail lookup failed for ${book.isbn13}.`, error);
    }
  }
  return selected;
};

const loadFreshLibraryDiscoveries = async (
  provider: LibraryProvider,
  seoul: { year: number; month: number; day: number },
  selectionSeed: string,
): Promise<CuratedBook[]> => {
  if (typeof provider.getLibraryItems !== 'function') return [];
  const page = 1 + (stableHash(`${selectionSeed}:library-page`) % 20);
  const libraries = await safely(() => provider.getLibraries({ page, pageSize: 50 }), []);
  const orderedLibraries = [...libraries]
    .filter(
      (library) =>
        !CHILD_FOCUSED_LIBRARY_WORDS.some((word) => library.name.includes(word)) && library.id,
    )
    .sort(
      (a, b) =>
        stableHash(`${selectionSeed}:library:${a.id}`) -
        stableHash(`${selectionSeed}:library:${b.id}`),
    );
  const chosenLibraries: typeof libraries = [];
  const regions = new Set<string>();
  for (const library of orderedLibraries) {
    const region = (library.address || library.region || library.name).slice(0, 5);
    if (regions.has(region)) continue;
    regions.add(region);
    chosenLibraries.push(library);
    if (chosenLibraries.length >= 3) break;
  }
  const startDate = shiftedDate(seoul.year, seoul.month, seoul.day, -60);
  const endDate = shiftedDate(seoul.year, seoul.month, seoul.day, -1);
  const results = await Promise.allSettled(
    chosenLibraries.map(async (library) => ({
      library,
      books: await provider.getLibraryItems!(library.id, {
        startDate,
        endDate,
        page: 1,
        pageSize: 30,
      }),
    })),
  );
  const sourceByIsbn = new Map<string, string>();
  const candidates = results.flatMap((result) => {
    if (result.status === 'rejected') return [];
    const books = adultCandidates(result.value.books);
    books.forEach((book) => sourceByIsbn.set(book.isbn13, result.value.library.name));
    return books;
  });
  return selectDiverse(candidates, 4, `${selectionSeed}:fresh-library`).map((book) => ({
    ...book,
    reason: `${sourceByIsbn.get(book.isbn13) || '참여 도서관'}에 최근 등록된 성인 도서`,
  }));
};

const loadMonthlyKeywordDetours = async (
  provider: LibraryProvider,
  monthlyKeywords: WeightedKeyword[],
  selectionSeed: string,
): Promise<CuratedBook[]> => {
  if (typeof provider.getBookKeywords !== 'function') return [];
  const keywords = monthlyKeywords.filter(
    (item) => item.word.trim().length >= 2 && !MONTHLY_KEYWORD_EXCLUSIONS.has(item.word.trim()),
  );
  const chosenKeywords = [...keywords]
    .slice(4, 40)
    .sort(
      (a, b) =>
        stableHash(`${selectionSeed}:detour:${a.word}`) -
        stableHash(`${selectionSeed}:detour:${b.word}`),
    )
    .slice(0, 2);
  const discoveries: CuratedBook[] = [];
  for (const keyword of chosenKeywords) {
    const page = 2 + (stableHash(`${selectionSeed}:keyword-page:${keyword.word}`) % 4);
    const searchResults = adultCandidates(
      await safely(() => provider.searchBooks(keyword.word, { page, pageSize: 20 }), []),
    );
    const inspected = orderedForDay(
      searchResults,
      `${selectionSeed}:keyword-inspect:${keyword.word}`,
    ).slice(0, 6);
    const keywordResults = await Promise.allSettled(
      inspected.map((book) => provider.getBookKeywords(book.isbn13)),
    );
    inspected.forEach((book, index) => {
      const result = keywordResults[index];
      if (
        result?.status === 'fulfilled' &&
        result.value.some((item) => keywordMatches(item.word, keyword.word))
      ) {
        discoveries.push({
          ...book,
          reason: `전월 관심어 ‘${keyword.word}’와 도서 핵심어가 연결된 깊은 검색 결과`,
        });
      }
    });
  }
  return selectDiverse(discoveries, 4, `${selectionSeed}:keyword-detours`).map((book) => ({
    ...book,
    reason:
      discoveries.find((candidate) => candidate.isbn13 === book.isbn13)?.reason ||
      '전월 관심어와 도서 핵심어가 연결된 책',
  }));
};

const loadManiaDiscovery = async (
  provider: LibraryProvider,
  pool: ExternalBook[],
  selectionSeed: string,
): Promise<CuratedBook[]> => {
  const seed = orderedForDay(pool, `${selectionSeed}:mania-seed`)[0];
  if (!seed) return [];
  const usage = await safely(() => provider.getBookUsageAnalysis(seed.isbn13), null);
  if (!usage) return [];
  const detailed = await detailAdultCandidates(
    provider,
    orderedForDay(usage.relatedBooks, `${selectionSeed}:mania-related`).slice(0, 8),
    2,
  );
  return detailed.map((book) => ({
    ...book,
    reason: `‘${seed.title}’을 깊게 읽는 독자의 마니아 추천에서 발견`,
  }));
};

const safely = async <T>(work: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await work();
  } catch (error) {
    console.warn('Data4Library collection signal failed.', error);
    return fallback;
  }
};

const previousMonth = (seoul: { year: number; month: number }): string => {
  const value = new Date(Date.UTC(seoul.year, seoul.month - 2, 1));
  return value.toISOString().slice(0, 7);
};

const buildKeywordCollection = async (
  provider: LibraryProvider,
  query: string,
  slug: string,
  title: string,
  month: string,
  monthlyKeywords: WeightedKeyword[],
  selectionSeed: string,
  excluded: Set<string>,
): Promise<Data4Category | null> => {
  if (REMOVED_AUTOMATIC_COLLECTION_SLUGS.has(slug)) return null;
  if (typeof provider.getBookKeywords !== 'function') return null;
  const candidates = adultCandidates(
    await safely(() => provider.searchBooks(query, { pageSize: 24 }), []),
  ).filter((book) => !excluded.has(book.isbn13));
  if (!candidates.length) return null;
  const inspected = orderedForDay(candidates, `${selectionSeed}:${slug}:keyword-sample`).slice(
    0,
    12,
  );
  const keywordResults = await Promise.allSettled(
    inspected.map((book) => provider.getBookKeywords(book.isbn13)),
  );
  const monthly = monthlyKeywords.slice(0, 12);
  const matches = new Map<string, string[]>();
  const scores = new Map<string, number>();
  inspected.forEach((book, index) => {
    const result = keywordResults[index];
    if (result?.status !== 'fulfilled') return;
    const bookKeywords = result.value;
    const normalizedKeywords = bookKeywords.map((keyword) => ({
      ...keyword,
      normalizedWord: normalizedText(keyword.word),
    }));
    const dataTopicKeywords = normalizedKeywords.filter((keyword) =>
      DATA_CAREER_TOPIC_WORDS.some((word) => keyword.normalizedWord.includes(normalizedText(word))),
    );
    if (slug === 'data-career-starter' && dataTopicKeywords.length === 0) return;
    const matched = monthly.filter((trend) =>
      bookKeywords.some((keyword) => keywordMatches(keyword.word, trend.word)),
    );
    const topicWeight = (
      slug === 'data-career-starter'
        ? dataTopicKeywords
        : normalizedKeywords.filter((keyword) => keywordMatches(keyword.word, query))
    ).reduce((sum, keyword) => sum + keyword.weight, 0);
    matches.set(
      book.isbn13,
      matched.map((item) => item.word),
    );
    scores.set(
      book.isbn13,
      topicWeight +
        matched.reduce((sum, trend) => {
          const bookWeight = Math.max(
            ...bookKeywords
              .filter((keyword) => keywordMatches(keyword.word, trend.word))
              .map((keyword) => keyword.weight),
            0,
          );
          return sum + trend.weight * bookWeight;
        }, 0),
    );
  });
  const eligible = inspected.filter((book) => scores.has(book.isbn13));
  const ordered = eligible.sort(
    (a, b) =>
      (scores.get(b.isbn13) ?? 0) - (scores.get(a.isbn13) ?? 0) ||
      stableHash(`${selectionSeed}:${slug}:${a.isbn13}`) -
        stableHash(`${selectionSeed}:${slug}:${b.isbn13}`),
  );
  const selected = selectDiverse(ordered, 6, `${selectionSeed}:${slug}`, excluded);
  if (selected.length < 2) return null;
  return {
    slug,
    title,
    description:
      slug === 'data-career-starter'
        ? `‘${query}’ 검색 후보 중 데이터 관련 도서 핵심어가 확인된 성인 도서입니다. ${month} 월간 관심 키워드는 후보 안에서 순위에만 반영합니다.`
        : `‘${query}’ 검색 후보의 핵심어를 ${month} 월간 관심 키워드와 교차해 고른 성인 도서입니다.`,
    basis:
      slug === 'data-career-starter'
        ? `srchBooks ‘${query}’ 검색 → ISBN 부가기호 성인 필터 → keywordList 데이터 관련 핵심어 확인 → monthlyKeywords ${month} 관심 키워드 보조 가중치 → srchDtlList 상세정보`
        : `srchBooks ‘${query}’ 검색 → ISBN 부가기호 성인 필터 → keywordList 도서별 핵심어 가중치 + monthlyKeywords ${month} 관심 키워드 → srchDtlList 상세정보`,
    books: withReason(selected, (book) => {
      const words = matches.get(book.isbn13) ?? [];
      return words.length
        ? `도서 핵심어와 월간 관심어 ‘${words.slice(0, 2).join(' · ')}’가 겹침`
        : `‘${query}’ 검색 결과에서 도서 핵심어 가중치로 선정`;
    }),
    alternatives: [],
  };
};

const buildAutomaticCollections = async (
  provider: LibraryProvider,
  seoul: { year: number; month: number; day: number },
  endDate: string,
  selectionSeed: string,
  excluded: Set<string>,
  sharedMonthlyKeywords?: WeightedKeyword[],
): Promise<Data4Category[]> => {
  const collections: Data4Category[] = [];
  const add = (collection: Data4Category | null) => {
    if (!collection) return;
    collections.push(collection);
    collection.books.forEach((book) => excluded.add(book.isbn13));
  };
  const month = previousMonth(seoul);
  const monthlyKeywords =
    sharedMonthlyKeywords ??
    (typeof provider.getMonthlyKeywords === 'function'
      ? await safely(() => provider.getMonthlyKeywords(month), [])
      : []);

  if (typeof provider.getHotTrend === 'function') {
    let hotTrendBooks: Awaited<ReturnType<LibraryProvider['getHotTrend']>> = [];
    for (let offset = 0; offset < 7 && hotTrendBooks.length === 0; offset += 1) {
      const candidateDate = new Date(`${endDate}T00:00:00Z`);
      candidateDate.setUTCDate(candidateDate.getUTCDate() - offset);
      hotTrendBooks = await safely(
        () => provider.getHotTrend(candidateDate.toISOString().slice(0, 10)),
        [],
      );
    }
    const trends = adultCandidates(hotTrendBooks)
      .filter(
        (book) =>
          book.kdc?.startsWith('3') ||
          ECONOMY_WORDS.some((word) => `${book.title} ${book.subject ?? ''}`.includes(word)),
      )
      .filter((book) => !excluded.has(book.isbn13) && book.rankRise > 0)
      .sort((a, b) => b.rankRise - a.rankRise || a.currentRank - b.currentRank);
    const selected = selectDiverse(trends, 6, `${selectionSeed}:rising-economy`, excluded);
    if (selected.length >= 2)
      add({
        slug: 'rising-economy',
        title: '최근 대출이 증가한 경제책',
        description: '전날 대출 순위가 상승한 경제·경영 분야 성인 도서입니다.',
        basis:
          'hotTrend 대출 급상승 도서 → KDC 3류/경제 주제 필터 → 상승 폭 순 → srchDtlList 상세정보',
        books: withReason(
          selected,
          (book) =>
            `전일 대비 대출 순위 ${trends.find((item) => item.isbn13 === book.isbn13)?.rankRise ?? 0}단계 상승`,
        ),
        alternatives: [],
      });
  }

  add(
    await safely(
      () =>
        buildKeywordCollection(
          provider,
          '데이터 분석',
          'data-career-starter',
          '데이터 직무 입문서',
          month,
          monthlyKeywords,
          selectionSeed,
          excluded,
        ),
      null,
    ),
  );
  add(
    await safely(
      () =>
        buildKeywordCollection(
          provider,
          '창업',
          'startup-keywords',
          '창업을 이해하는 핵심어 도서',
          month,
          monthlyKeywords,
          selectionSeed,
          excluded,
        ),
      null,
    ),
  );
  add(
    await safely(
      () =>
        buildKeywordCollection(
          provider,
          '철학',
          'philosophy-keywords',
          '철학의 핵심어로 찾은 책',
          month,
          monthlyKeywords,
          selectionSeed,
          excluded,
        ),
      null,
    ),
  );

  if (monthlyKeywords.length) {
    const keywords = monthlyKeywords;
    const keyword =
      keywords.find((item) => item.word.includes('관계')) ??
      keywords.find(
        (item) => item.word.length >= 2 && !MONTHLY_KEYWORD_EXCLUSIONS.has(item.word.trim()),
      );
    if (keyword) {
      add(
        await safely(
          () =>
            buildKeywordCollection(
              provider,
              keyword.word,
              'monthly-keyword',
              `이번 달 키워드 ‘${keyword.word}’와 연결되는 책`,
              month,
              monthlyKeywords,
              selectionSeed,
              excluded,
            ),
          null,
        ),
      );
    }
  }
  return collections;
};

export async function buildData4CategoryFeed(
  provider: LibraryProvider,
  now = new Date(),
  refreshSeed = '',
  onlyCategory = '',
): Promise<Data4CategoryFeed> {
  const seoul = seoulDateParts(now);
  const discoveryDate = seoul.date;
  const selectionSeed = refreshSeed ? `${discoveryDate}:${refreshSeed}` : discoveryDate;
  const endDate = shiftedDate(seoul.year, seoul.month, seoul.day, -1);
  const startDate = shiftedDate(seoul.year, seoul.month, seoul.day, -365);
  const firstPage = 5 + (stableHash(`${selectionSeed}:candidate-page`) % 36);
  const discoveryPages = Array.from(
    { length: DISCOVERY_PAGE_COUNT },
    (_, index) => 5 + ((firstPage - 5 + index * 11) % 36),
  );
  const needsClassics = !onlyCategory || onlyCategory === 'classics';
  const needsDiscovery = !onlyCategory || onlyCategory !== 'classics';
  const rankingRequests = needsDiscovery
    ? discoveryPages.map((page) => ({ page, startDate, purpose: '후보 탐색' }))
    : [];

  const candidateResults = await Promise.allSettled(
    rankingRequests.map(({ page, startDate: requestStartDate }) =>
      provider.getLoanRanking({
        startDate: requestStartDate,
        endDate,
        age: '14;20;30;40;50;60;-1',
        addCode: '0;1;2;9',
        page,
        pageSize: 100,
      }),
    ),
  );
  const classicEditions = needsClassics
    ? await loadClassicEditions(provider, selectionSeed)
    : { books: [], warning: undefined };
  const warnings =
    candidateResults.some((result) => result.status === 'rejected') || classicEditions.warning
      ? ['정보나루 일부 응답이 지연되어 확보된 추천만 보여드립니다.']
      : [];

  // 정보나루가 순위 형태로 제공하는 응답을 후보 확보에만 사용한다.
  // 순위와 대출횟수는 즉시 제거하며 이후 정렬, 점수, 추천 이유에 사용하지 않는다.
  const pool = uniqueByIsbn(
    candidateResults.flatMap((result) =>
      result.status === 'fulfilled' ? adultCandidates(result.value).map(withoutRanking) : [],
    ),
  );

  const used = new Set(classicEditions.books.map((book) => book.isbn13));
  const month = previousMonth(seoul);
  const monthlyKeywords =
    needsDiscovery && typeof provider.getMonthlyKeywords === 'function'
      ? await safely(() => provider.getMonthlyKeywords(month), [])
      : [];
  const needsToday = !onlyCategory || onlyCategory === 'daily-serendipity';
  const [freshDiscoveries, keywordDiscoveries] = needsToday
    ? await Promise.all([
        loadFreshLibraryDiscoveries(provider, seoul, selectionSeed),
        loadMonthlyKeywordDetours(provider, monthlyKeywords, selectionSeed),
      ])
    : [[], []];
  const maniaDiscoveries = needsToday
    ? await loadManiaDiscovery(
        provider,
        uniqueByIsbn([...pool, ...freshDiscoveries, ...keywordDiscoveries]),
        selectionSeed,
      )
    : [];
  const longTailDiscoveries = withReason(
    selectDiverse(pool, 6, `${selectionSeed}:long-tail`, used),
    () => '최근 1년 후보의 인기 상위권을 벗어난 페이지에서 순위를 제거한 뒤 발견',
  );
  const today: CuratedBook[] = [];
  const appendToday = (candidates: CuratedBook[], count: number, source: string) => {
    const excluded = new Set([...used, ...today.map((book) => book.isbn13)]);
    const reasons = new Map(candidates.map((book) => [book.isbn13, book.reason]));
    today.push(
      ...selectDiverse(candidates, count, `${selectionSeed}:today:${source}`, excluded).map(
        (book) => ({
          ...book,
          reason: reasons.get(book.isbn13) || '서로 다른 데이터 경로에서 발견',
        }),
      ),
    );
  };
  appendToday(freshDiscoveries, 2, 'fresh');
  appendToday(keywordDiscoveries, 2, 'keyword');
  appendToday(maniaDiscoveries, 1, 'mania');
  appendToday(longTailDiscoveries, 1, 'long-tail');
  if (today.length < 6) {
    appendToday(
      [
        ...freshDiscoveries,
        ...keywordDiscoveries,
        ...maniaDiscoveries,
        ...longTailDiscoveries,
        ...withReason(
          pool,
          (book) =>
            `${book.subject?.split(' > ')[0] || '낯선 분야'}의 장기 후보에서 순위를 제거한 뒤 발견`,
        ),
      ],
      6 - today.length,
      'fallback',
    );
  }
  today.forEach((book) => used.add(book.isbn13));

  const outsideLiterature = selectDiverse(
    [...freshDiscoveries, ...keywordDiscoveries, ...longTailDiscoveries, ...pool].filter(
      (book) => majorKdc(book) !== '8',
    ),
    24,
    `${selectionSeed}:fields`,
    used,
  );
  outsideLiterature.forEach((book) => used.add(book.isbn13));
  let automaticCollections: Data4Category[] = [];
  if (!onlyCategory || AUTOMATIC_COLLECTION_SLUGS.includes(onlyCategory as never)) {
    try {
      automaticCollections = await buildAutomaticCollections(
        provider,
        seoul,
        endDate,
        selectionSeed,
        used,
        monthlyKeywords,
      );
    } catch (error) {
      warnings.push('일부 데이터 기반 컬렉션을 불러오지 못해 이번 동기화에서는 제외했습니다.');
      console.warn('Automatic data collection discovery failed.', error);
    }
  }

  const categories: Data4Category[] = [
    {
      slug: 'daily-serendipity',
      title: '오늘의 뜻밖의 책',
      description:
        '최근 등록 도서, 월간 관심어, 마니아 추천과 장기 후보를 서로 다른 경로에서 고른 책입니다.',
      basis:
        'itemSrch 최근 등록 2권 + monthlyKeywords→srchBooks→keywordList 2권 + usageAnalysisList 마니아 추천 1권 + loanItemSrch 장기 후보 1권 → srchDtlList 상세정보',
      books: today.slice(0, 6),
      alternatives: [],
    },
    {
      slug: 'classics',
      title: '고전',
      description: '작품 단위 고전 목록을 날짜별로 섞고, 확인된 국내 성인 판본만 보여줍니다.',
      basis: '작품 단위 고전 목록 날짜별 무작위 → srchBooks 판본 확인 → 아동용/축약/만화판 제외',
      books: classicEditions.books.slice(0, 8),
      alternatives: [],
    },
    {
      slug: 'outside-literature',
      title: '비문학 분야별 추천',
      description: '문학을 제외하고 서로 다른 KDC 분야에서 고른 성인 도서입니다.',
      basis:
        'itemSrch 최근 등록 + monthlyKeywords 키워드 옆길 + loanItemSrch 장기 후보 → KDC 비문학 필터 → srchDtlList 상세정보',
      books: withReason(
        outsideLiterature.slice(0, 6),
        (book) => book.subject || `KDC ${book.kdc || '미분류'}`,
      ),
      alternatives: [],
    },
    ...automaticCollections,
  ].filter(
    (category) => category.books.length > 0 && (!onlyCategory || category.slug === onlyCategory),
  );

  return {
    generatedAt: now.toISOString(),
    discoveryDate,
    categories,
    publisherShelves: [],
    publisherAlternatives: [],
    warnings,
    source: 'data4library',
  };
}
