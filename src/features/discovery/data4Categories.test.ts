import { describe, expect, it, vi } from 'vitest';
import type { ExternalBook } from '../../domain/models';
import type { LibraryProvider } from '../../providers/types';
import { buildData4CategoryFeed, isAdultCandidate } from './data4Categories';

const book = (index: number, options: Partial<ExternalBook> = {}): ExternalBook => ({
  isbn13: `978000000${String(index).padStart(4, '0')}`,
  title: `책 ${index}`,
  author: `저자 ${index}`,
  publisher: `출판사 ${index % 5}`,
  publishedAt: String(1990 + index),
  additionSymbol: '03810',
  kdc: `${index % 10}00`,
  subject: `분야 ${index % 10}`,
  source: 'data4library',
  ...options,
});

describe('buildData4CategoryFeed', () => {
  it('아동·초등·청소년 부가기호를 일반 추천 후보에서 제외한다', () => {
    expect(isAdultCandidate(book(1, { additionSymbol: '03810' }))).toBe(true);
    expect(isAdultCandidate(book(2, { additionSymbol: '77810' }))).toBe(false);
    expect(isAdultCandidate(book(3, { additionSymbol: '63400' }))).toBe(false);
    expect(isAdultCandidate(book(4, { additionSymbol: '44810' }))).toBe(false);
    expect(isAdultCandidate(book(5, { additionSymbol: undefined }))).toBe(false);
    expect(isAdultCandidate(book(6, { title: '초등 영어 문해력', additionSymbol: '03810' }))).toBe(
      true,
    );
  });

  it('순위 값을 제거하고 날짜별 무작위와 다양성 규칙으로 선반을 만든다', async () => {
    const pool = Array.from({ length: 80 }, (_, index) => ({
      ...book(index + 1, {
        publishedAt: String(1980 + (index % 40)),
        publisher: `출판사 ${index % 8}`,
      }),
      rank: index + 101,
      loanCount: 500 - index,
    }));
    Object.assign(pool[0]!, { title: '1984', author: '조지 오웰', rank: 1 });
    const getLoanRanking = vi.fn().mockResolvedValue(pool);
    let classicIndex = 0;
    const searchBooks = vi.fn().mockImplementation((query: string) => [
      book(900 + classicIndex++, {
        title: query,
        author:
          '호메로스 단테 세르반테스 셰익스피어 제인 오스틴 허먼 멜빌 도스토옙스키 톨스토이 플로베르 빅토르 위고 찰스 디킨스 괴테 카프카 토마스 만 버지니아 울프 조지 오웰 올더스 헉슬리 알베르 카뮈 가브리엘 가르시아 마르케스 박경리 최인훈 염상섭 조세희',
        additionSymbol: '03810',
      }),
    ]);
    const provider = { getLoanRanking, searchBooks } as unknown as LibraryProvider;

    const feed = await buildData4CategoryFeed(provider, new Date('2026-09-17T00:00:00Z'));

    expect(feed.discoveryDate).toBe('2026-09-17');
    expect(feed.categories.map((category) => category.slug)).toEqual([
      'daily-serendipity',
      'classics',
      'outside-literature',
    ]);
    expect(feed.categories[0]?.books).toHaveLength(6);
    expect(feed.categories[0]?.alternatives).toEqual([]);
    expect(feed.categories[0]?.basis).not.toContain('대출순위');
    expect(feed.categories[1]?.title).toBe('고전');
    expect(feed.categories[1]?.basis).toContain('작품 단위 고전 목록');
    expect(feed.categories[1]?.books.every((item) => item.reason.includes('무작위'))).toBe(true);
    expect(searchBooks).toHaveBeenCalledTimes(12);
    expect(getLoanRanking.mock.calls.length + searchBooks.mock.calls.length).toBeLessThanOrEqual(
      18,
    );
    expect(feed.publisherAlternatives).toBeDefined();
    expect(feed.categories[2]?.books.every((item) => !item.kdc?.startsWith('8'))).toBe(true);
    const categoryBooks = feed.categories.flatMap((category) => category.books);
    expect(new Set(categoryBooks.map((item) => item.isbn13)).size).toBe(categoryBooks.length);
    expect(categoryBooks.every((item) => !('rank' in item) && !('loanCount' in item))).toBe(true);
    expect(getLoanRanking).toHaveBeenCalledTimes(2);
    expect(getLoanRanking.mock.calls[0]?.[0]).toMatchObject({
      age: '14;20;30;40;50;60;-1',
      addCode: '0;1;2;9',
      pageSize: 100,
    });
  });

  it('새로고침할 때 요청한 카테고리의 후보만 다시 조회한다', async () => {
    const pool = Array.from({ length: 40 }, (_, index) => ({
      ...book(index + 1),
      rank: index + 1,
      loanCount: 100 - index,
    }));
    const getLoanRanking = vi.fn().mockResolvedValue(pool);
    const searchBooks = vi.fn();
    const provider = { getLoanRanking, searchBooks } as unknown as LibraryProvider;

    const feed = await buildData4CategoryFeed(
      provider,
      new Date('2026-09-17T00:00:00Z'),
      'daily-serendipity:1',
      'daily-serendipity',
    );

    expect(feed.categories.map((category) => category.slug)).toEqual(['daily-serendipity']);
    expect(getLoanRanking).toHaveBeenCalledTimes(2);
    expect(searchBooks).not.toHaveBeenCalled();
    expect(feed.publisherShelves).toEqual([]);
  });

  it('고전은 인기대출 조회 없이 작품 목록을 무작위로 섞어 판본만 확인한다', async () => {
    let editionIndex = 0;
    const getLoanRanking = vi.fn();
    const searchBooks = vi.fn().mockImplementation((query: string) => [
      book(700 + editionIndex++, {
        title: query,
        author:
          '호메로스 단테 세르반테스 셰익스피어 제인 오스틴 허먼 멜빌 도스토옙스키 톨스토이 플로베르 빅토르 위고 찰스 디킨스 괴테 카프카 토마스 만 버지니아 울프 조지 오웰 올더스 헉슬리 알베르 카뮈 가브리엘 가르시아 마르케스 박경리 최인훈 염상섭 조세희',
      }),
    ]);
    const provider = { getLoanRanking, searchBooks } as unknown as LibraryProvider;

    const feed = await buildData4CategoryFeed(
      provider,
      new Date('2026-09-17T00:00:00Z'),
      '',
      'classics',
    );

    expect(getLoanRanking).not.toHaveBeenCalled();
    expect(searchBooks).toHaveBeenCalledTimes(12);
    expect(feed.categories).toHaveLength(1);
    expect(feed.categories[0]?.basis).toContain('날짜별 무작위');
    expect(feed.categories[0]?.books.every((item) => item.reason.includes('무작위'))).toBe(true);
  });

  it('오늘의 여섯 권을 서로 다른 데이터 경로의 목표 비율로 조합한다', async () => {
    const pool = Array.from({ length: 30 }, (_, index) => ({
      ...book(index + 1),
      rank: index + 101,
      loanCount: 50 - index,
    }));
    const fresh = [book(101), book(102), book(103)];
    const keywordBooks = [book(201), book(202), book(203), book(204)];
    const maniaBook = book(301);
    const keywords = Array.from({ length: 8 }, (_, index) => ({
      word: `관심어${index}`,
      weight: 100 - index,
    }));
    const getMonthlyKeywords = vi.fn().mockResolvedValue(keywords);
    const provider = {
      getLoanRanking: vi.fn().mockResolvedValue(pool),
      getLibraries: vi.fn().mockResolvedValue([
        { id: '1', name: '첫 도서관', address: '서울 중구' },
        { id: '2', name: '둘 도서관', address: '부산 중구' },
        { id: '3', name: '셋 도서관', address: '대전 중구' },
      ]),
      getLibraryItems: vi.fn().mockResolvedValue(fresh),
      getMonthlyKeywords,
      searchBooks: vi.fn().mockResolvedValue(keywordBooks),
      getBookKeywords: vi.fn().mockImplementation(async () => keywords),
      getBookUsageAnalysis: vi.fn().mockResolvedValue({
        isbn13: pool[0]!.isbn13,
        loanHistory: [],
        keywords: [],
        relatedBooks: [maniaBook],
        raw: {},
      }),
      getBookDetail: vi
        .fn()
        .mockImplementation(async (isbn: string) =>
          [maniaBook, ...fresh, ...keywordBooks, ...pool].find((item) => item.isbn13 === isbn),
        ),
    } as unknown as LibraryProvider;

    const feed = await buildData4CategoryFeed(
      provider,
      new Date('2026-09-17T00:00:00Z'),
      '',
      'daily-serendipity',
    );
    const reasons = feed.categories[0]!.books.map((item) => item.reason);

    expect(reasons.filter((reason) => reason.includes('최근 등록'))).toHaveLength(2);
    expect(reasons.filter((reason) => reason.includes('전월 관심어'))).toHaveLength(2);
    expect(reasons.filter((reason) => reason.includes('마니아 추천'))).toHaveLength(1);
    expect(reasons.filter((reason) => reason.includes('인기 상위권'))).toHaveLength(1);
    expect(getMonthlyKeywords).toHaveBeenCalledTimes(1);
  });

  it('데이터 직무 선반에서는 데이터 핵심어가 없는 검색 결과를 제외한다', async () => {
    const candidates = [
      book(201, { title: '데이터로 일하는 법' }),
      book(202, { title: 'SQL 실무' }),
      book(203, { title: '총, 균, 쇠' }),
    ];
    const provider = {
      getLoanRanking: vi.fn().mockResolvedValue([]),
      searchBooks: vi
        .fn()
        .mockImplementation((query: string) => (query === '데이터 분석' ? candidates : [])),
      getMonthlyKeywords: vi.fn().mockResolvedValue([{ word: '역사', weight: 100 }]),
      getBookKeywords: vi.fn().mockImplementation((isbn: string) => {
        if (isbn === candidates[0]?.isbn13) return [{ word: '데이터 분석', weight: 10 }];
        if (isbn === candidates[1]?.isbn13) return [{ word: 'SQL', weight: 8 }];
        return [{ word: '역사', weight: 100 }];
      }),
    } as unknown as LibraryProvider;

    const feed = await buildData4CategoryFeed(
      provider,
      new Date('2026-09-17T00:00:00Z'),
      '',
      'data-career-starter',
    );

    expect(feed.categories).toEqual([]);
  });
});
