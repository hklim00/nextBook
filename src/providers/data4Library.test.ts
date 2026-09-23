import { describe, expect, it, vi } from 'vitest';
import { Data4LibraryProvider } from './data4Library';

describe('Data4LibraryProvider', () => {
  it('설정된 호출 예산을 넘기기 전에 요청을 차단한다', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ response: {} }));
    const provider = new Data4LibraryProvider({
      apiKey: 'test-key',
      fetcher,
      maxRequests: 1,
    });

    await provider.getLibraries();
    await expect(provider.getLibraries()).rejects.toMatchObject({ status: 429 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('도서관 목록을 정규화한다', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        response: {
          libs: [
            {
              lib: {
                libCode: '111001',
                libName: '서울도서관',
                address: '서울특별시 중구',
                tel: '02-000-0000',
                homepage: 'https://lib.example.test',
                closed: '월요일',
                operatingTime: '09:00~18:00',
              },
            },
          ],
        },
      }),
    );
    const provider = new Data4LibraryProvider({ apiKey: 'test-key', fetcher });

    await expect(provider.getLibraries({ region: '11' })).resolves.toEqual([
      expect.objectContaining({ id: '111001', name: '서울도서관', region: '서울특별시 중구' }),
    ]);

    const calledUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe('/api/libSrch');
    expect(calledUrl.searchParams.get('authKey')).toBe('test-key');
    expect(calledUrl.searchParams.get('format')).toBe('json');
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ headers: { Accept: '*/*' } });
  });

  it('소장과 전날 기준 대출 가능 여부를 분리한다', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ response: { result: { hasBook: 'Y', loanAvailable: 'N' } } }),
      );
    const provider = new Data4LibraryProvider({ apiKey: 'test-key', fetcher });

    await expect(provider.checkBookAvailability('111001', '9788936433598')).resolves.toMatchObject({
      libraryId: '111001',
      isbn13: '9788936433598',
      held: true,
      available: false,
      basis: 'previous_day',
    });
  });

  it('대출 순위와 대출 횟수를 정규화한다', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        response: {
          docs: [
            {
              doc: {
                ranking: '3',
                bookname: '소년이 온다',
                authors: '한강',
                publisher: '창비',
                publication_year: '2014',
                isbn13: '9788936434120',
                addition_symbol: '03810',
                loan_count: '1,234',
                class_no: '813.7',
              },
            },
          ],
        },
      }),
    );
    const provider = new Data4LibraryProvider({ apiKey: 'test-key', fetcher });

    await expect(
      provider.getLoanRanking({ startDate: '2026-01-01', endDate: '2026-01-31' }),
    ).resolves.toEqual([
      expect.objectContaining({
        rank: 3,
        loanCount: 1234,
        title: '소년이 온다',
        additionSymbol: '03810',
      }),
    ]);
  });

  it('소장 도서관 조회에는 지역 코드를 요구한다', async () => {
    const provider = new Data4LibraryProvider({
      apiKey: 'test-key',
      fetcher: vi.fn<typeof fetch>(),
    });
    await expect(
      provider.getLibrariesHoldingBook('9788936433598', { region: '' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('대출 급상승 결과를 날짜와 순위 변화로 정규화한다', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        response: {
          results: [
            {
              result: {
                date: '2026-09-15',
                docs: [
                  {
                    doc: {
                      no: 1,
                      difference: 85,
                      baseWeekRank: 91,
                      pastWeekRank: 176,
                      bookname: '지구 끝의 온실',
                      authors: '김초엽',
                      publisher: '자이언트북스',
                      publication_year: '2021',
                      isbn13: '9791191824001',
                      class_no: '813.7',
                      class_nm: '문학 > 한국문학 > 소설',
                    },
                  },
                ],
              },
            },
          ],
        },
      }),
    );
    const provider = new Data4LibraryProvider({ apiKey: 'test-key', fetcher });

    await expect(provider.getHotTrend('2026-09-15')).resolves.toEqual([
      expect.objectContaining({
        isbn13: '9791191824001',
        trendDate: '2026-09-15',
        rankRise: 85,
        currentRank: 91,
        previousRank: 176,
      }),
    ]);
  });

  it('대출순위 없이 정렬된 카탈로그 구간을 탐색한다', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        response: {
          docs: [
            {
              doc: {
                bookname: '낯선 책',
                authors: '새로운 저자',
                publisher: '새로운 출판사',
                publication_year: '2011',
                isbn13: '9780000000001',
                addition_symbol: '03810',
              },
            },
          ],
        },
      }),
    );
    const provider = new Data4LibraryProvider({ apiKey: 'test-key', fetcher });

    await provider.browseBooks({
      publisher: '새로운 출판사',
      page: 17,
      pageSize: 40,
      sort: 'isbn',
      order: 'asc',
    });

    const calledUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe('/api/srchBooks');
    expect(calledUrl.searchParams.get('keyword')).toBeNull();
    expect(calledUrl.searchParams.get('publisher')).toBe('새로운 출판사');
    expect(calledUrl.searchParams.get('sort')).toBe('isbn');
    expect(calledUrl.searchParams.get('pageNo')).toBe('17');
  });

  it('도서관의 최근 등록 도서와 등록일을 정규화한다', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        response: {
          docs: [
            {
              doc: {
                bookname: '최근 들어온 책',
                authors: '새 저자',
                publisher: '새 출판사',
                publication_year: '2026',
                isbn13: '9780000000094',
                addition_symbol: '03900',
                class_no: '331.5',
                class_nm: '사회과학 > 사회학',
                reg_date: '2026-09-10',
                bookImageURL: 'https://example.test/cover.jpg',
              },
            },
          ],
        },
      }),
    );
    const provider = new Data4LibraryProvider({ apiKey: 'test-key', fetcher });

    await expect(
      provider.getLibraryItems('111001', {
        startDate: '2026-08-01',
        endDate: '2026-09-21',
        page: 2,
        pageSize: 30,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        title: '최근 들어온 책',
        registeredAt: '2026-09-10',
        additionSymbol: '03900',
        coverUrl: 'https://example.test/cover.jpg',
      }),
    ]);

    const calledUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe('/api/itemSrch');
    expect(calledUrl.searchParams.get('libCode')).toBe('111001');
    expect(calledUrl.searchParams.get('startDt')).toBe('2026-08-01');
    expect(calledUrl.searchParams.get('endDt')).toBe('2026-09-21');
    expect(calledUrl.searchParams.get('pageNo')).toBe('2');
  });

  it('이달의 키워드와 가중치를 정규화한다', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        response: {
          keywords: [
            { keyword: { word: '부동산', weight: '46.674' } },
            { keyword: { word: 'AI', weight: 20.723 } },
          ],
        },
      }),
    );
    const provider = new Data4LibraryProvider({ apiKey: 'test-key', fetcher });

    await expect(provider.getMonthlyKeywords('2026-08')).resolves.toEqual([
      { word: '부동산', weight: 46.674 },
      { word: 'AI', weight: 20.723 },
    ]);
  });
});
