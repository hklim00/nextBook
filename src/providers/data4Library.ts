import type {
  BookAvailability,
  BookUsageAnalysis,
  ExternalBook,
  HotTrendBook,
  Library,
  LoanHistoryPoint,
  LoanRankingBook,
  WeightedKeyword,
} from '../domain/models';
import type {
  BookBrowseOptions,
  BookSearchOptions,
  HoldingLibraryOptions,
  LibraryItemOptions,
  LibraryProvider,
  LibrarySearchOptions,
  LoanRankingQuery,
} from './types';
import {
  asArray,
  asBoolean,
  asNumber,
  asRecord,
  asString,
  fetchJson,
  isRecord,
  normalizeIsbn,
  ProviderError,
  requiredKey,
  unwrapItems,
} from './http';
import { cleanAuthorDisplay, normalizePublishedDate, splitBookTitle } from '../lib/bookMetadata';

const PROVIDER = '도서관 정보나루';
const DEFAULT_BASE_URL = 'https://data4library.kr/api/';

interface Data4LibraryProviderOptions {
  apiKey: string | undefined;
  fetcher?: typeof fetch;
  baseUrl?: string;
  maxRequests?: number;
}

const valueFrom = (record: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );

const toLibrary = (record: Record<string, unknown>): Library | null => {
  const id = asString(valueFrom(record, 'libCode', 'lib_code'));
  const name = asString(valueFrom(record, 'libName', 'lib_name'));
  if (!id || !name) return null;
  return {
    id,
    name,
    region: asString(valueFrom(record, 'address', 'region', 'regionName')),
    address: asString(valueFrom(record, 'address')) || undefined,
    telephone: asString(valueFrom(record, 'tel', 'telephone')) || undefined,
    homepage: asString(valueFrom(record, 'homepage', 'homepageUrl')) || undefined,
    closedDays: asString(valueFrom(record, 'closed', 'closedDays')) || undefined,
    operatingHours: asString(valueFrom(record, 'operatingTime', 'operatingHours')) || undefined,
  };
};

const toBook = (record: Record<string, unknown>): ExternalBook | null => {
  const isbn13 = normalizeIsbn(valueFrom(record, 'isbn13', 'isbn'));
  const titleParts = splitBookTitle(asString(valueFrom(record, 'bookname', 'bookName', 'title')));
  const title = titleParts.title;
  if (!isbn13 || !title) return null;
  return {
    isbn13,
    title,
    subtitle: titleParts.subtitle,
    author: cleanAuthorDisplay(asString(valueFrom(record, 'authors', 'author'))),
    publisher: asString(valueFrom(record, 'publisher')),
    publishedAt: normalizePublishedDate(
      asString(valueFrom(record, 'publication_date', 'publication_year')) || undefined,
    ),
    registeredAt: asString(valueFrom(record, 'reg_date', 'regDate')) || undefined,
    additionSymbol: asString(valueFrom(record, 'addition_symbol', 'additionSymbol')) || undefined,
    description:
      decodeHtmlEntities(asString(valueFrom(record, 'description', 'bookDtl'))) || undefined,
    kdc: asString(valueFrom(record, 'class_no', 'classNo', 'kdc')) || undefined,
    subject: asString(valueFrom(record, 'class_nm', 'className')) || undefined,
    coverUrl:
      asString(valueFrom(record, 'bookImageURL', 'bookImageUrl')).replace(
        /^http:\/\//,
        'https://',
      ) || undefined,
    detailUrl: asString(valueFrom(record, 'bookDtlUrl', 'bookDetailUrl')) || undefined,
    source: 'data4library',
  };
};

const findArrays = (value: unknown, names: Set<string>): unknown[] => {
  if (Array.isArray(value)) return value.flatMap((item) => findArrays(item, names));
  if (!isRecord(value)) return [];
  const found: unknown[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (names.has(key)) found.push(...asArray(child));
    if (isRecord(child) || Array.isArray(child)) found.push(...findArrays(child, names));
  }
  return found;
};

export class Data4LibraryProvider implements LibraryProvider {
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;
  private readonly baseUrl: string;
  private readonly maxRequests?: number;
  private requestCount = 0;

  constructor(options: Data4LibraryProviderOptions) {
    this.apiKey = requiredKey(options.apiKey, PROVIDER);
    this.fetcher = options.fetcher ?? fetch;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.maxRequests = options.maxRequests;
  }

  private async request(
    endpoint: string,
    params: Record<string, string | number | undefined>,
  ): Promise<unknown> {
    if (this.maxRequests !== undefined && this.requestCount >= this.maxRequests) {
      throw new ProviderError(
        `정보나루 호출 예산 ${this.maxRequests}건을 모두 사용했습니다.`,
        PROVIDER,
        429,
      );
    }
    this.requestCount += 1;
    const url = new URL(endpoint, this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`);
    url.searchParams.set('authKey', this.apiKey);
    url.searchParams.set('format', 'json');
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }
    // Data4Library returns 406 for an explicit `Accept: application/json` header.
    // `format=json` is the supported response-format switch.
    const payload = await fetchJson(PROVIDER, url, this.fetcher, {
      headers: { Accept: '*/*' },
    });
    const root = asRecord(payload);
    const response = asRecord(root.response ?? root);
    const error = asString(response.error ?? root.error);
    if (error) throw new ProviderError(error, PROVIDER);
    return payload;
  }

  async getLibraries(options: LibrarySearchOptions = {}) {
    const payload = await this.request('libSrch', {
      region: options.region,
      dtl_region: options.detailRegion,
      pageNo: Math.max(1, options.page ?? 1),
      pageSize: Math.min(100, Math.max(1, options.pageSize ?? 20)),
    });
    const libraries = unwrapItems(payload, 'libs', 'lib')
      .map(toLibrary)
      .filter((library): library is Library => library !== null);
    const query = options.query?.trim().toLocaleLowerCase('ko');
    return query
      ? libraries.filter((library) =>
          `${library.name} ${library.address ?? ''}`.toLocaleLowerCase('ko').includes(query),
        )
      : libraries;
  }

  async checkBookAvailability(libraryId: string, isbn13: string): Promise<BookAvailability> {
    const normalized = normalizeIsbn(isbn13);
    if (!libraryId.trim() || !normalized) {
      throw new ProviderError('도서관 코드와 ISBN13이 필요합니다.', PROVIDER, 400);
    }
    const payload = await this.request('bookExist', {
      libCode: libraryId.trim(),
      isbn13: normalized,
    });
    const root = asRecord(payload);
    const response = asRecord(root.response ?? root);
    const result = asRecord(response.result ?? response);
    return {
      libraryId: libraryId.trim(),
      isbn13: normalized,
      held: asBoolean(valueFrom(result, 'hasBook', 'result')) === true,
      available: asBoolean(valueFrom(result, 'loanAvailable')),
      checkedAt: new Date().toISOString(),
      basis: 'previous_day',
    };
  }

  async getLibrariesHoldingBook(isbn13: string, options: HoldingLibraryOptions) {
    const normalized = normalizeIsbn(isbn13);
    if (!normalized || !options.region.trim()) {
      throw new ProviderError('ISBN13과 광역 지역 코드가 필요합니다.', PROVIDER, 400);
    }
    const payload = await this.request('libSrchByBook', {
      isbn: normalized,
      region: options.region,
      dtl_region: options.detailRegion,
      pageNo: Math.max(1, options.page ?? 1),
      pageSize: Math.min(100, Math.max(1, options.pageSize ?? 20)),
    });
    return unwrapItems(payload, 'libs', 'lib')
      .map(toLibrary)
      .filter((library): library is Library => library !== null);
  }

  async getLibraryItems(libraryId: string, options: LibraryItemOptions = {}) {
    const payload = await this.request('itemSrch', {
      libCode: libraryId.trim(),
      type: 'ALL',
      startDt: options.startDate,
      endDt: options.endDate,
      pageNo: Math.max(1, options.page ?? 1),
      pageSize: Math.min(100, Math.max(1, options.pageSize ?? 30)),
    });
    return unwrapItems(payload, 'docs', 'doc')
      .map(toBook)
      .filter((book): book is ExternalBook => book !== null);
  }

  async searchBooks(query: string, options: BookSearchOptions = {}) {
    const keyword = query.trim();
    if (!keyword) return [];
    const payload = await this.request('srchBooks', {
      keyword,
      pageNo: Math.max(1, options.page ?? 1),
      pageSize: Math.min(100, Math.max(1, options.pageSize ?? 20)),
    });
    return unwrapItems(payload, 'docs', 'doc')
      .map(toBook)
      .filter((book): book is ExternalBook => book !== null);
  }

  async browseBooks(options: BookBrowseOptions = {}) {
    const payload = await this.request('srchBooks', {
      publisher: options.publisher?.trim() || undefined,
      sort: options.sort ?? 'isbn',
      order: options.order ?? 'asc',
      pageNo: Math.max(1, options.page ?? 1),
      pageSize: Math.min(100, Math.max(1, options.pageSize ?? 100)),
    });
    return unwrapItems(payload, 'docs', 'doc')
      .map(toBook)
      .filter((book): book is ExternalBook => book !== null);
  }

  async getBookDetail(isbn13: string): Promise<ExternalBook | null> {
    const normalized = normalizeIsbn(isbn13);
    if (!normalized) throw new ProviderError('올바른 ISBN13이 필요합니다.', PROVIDER, 400);
    const payload = await this.request('srchDtlList', {
      isbn13: normalized,
      loaninfoYN: 'Y',
      displayInfo: 'age',
    });
    const detailRecords = findArrays(payload, new Set(['detail'])).flatMap((value) => {
      const detail = asRecord(value);
      const nestedBooks = asArray(detail.book).map((book) => ({
        ...detail,
        ...asRecord(book),
      }));
      return nestedBooks.length ? nestedBooks : [detail];
    });
    const candidates = [...detailRecords, ...findArrays(payload, new Set(['book', 'doc']))]
      .map((value) => toBook(asRecord(value)))
      .filter((book): book is ExternalBook => book !== null);
    return candidates.find((book) => book.isbn13 === normalized) ?? candidates[0] ?? null;
  }

  async getRecommendedBooks(isbn13: string): Promise<ExternalBook[]> {
    const normalized = normalizeIsbn(isbn13);
    if (!normalized) throw new ProviderError('올바른 ISBN13이 필요합니다.', PROVIDER, 400);
    const payload = await this.request('recommandList', { isbn13: normalized, type: 'mania' });
    return unwrapItems(payload, 'docs', 'book')
      .map(toBook)
      .filter((book): book is ExternalBook => book !== null && book.isbn13 !== normalized);
  }

  async getLoanRanking(query: LoanRankingQuery): Promise<LoanRankingBook[]> {
    const payload = await this.request('loanItemSrch', {
      startDt: query.startDate,
      endDt: query.endDate,
      gender: query.gender,
      age: query.age,
      from_age: query.fromAge,
      to_age: query.toAge,
      region: query.region,
      dtl_region: query.detailRegion,
      addCode: query.addCode,
      kdc: query.kdc,
      pageNo: Math.max(1, query.page ?? 1),
      pageSize: Math.min(100, Math.max(1, query.pageSize ?? 50)),
    });
    return unwrapItems(payload, 'docs', 'doc')
      .map((record) => {
        const book = toBook(record);
        if (!book) return null;
        return {
          ...book,
          rank: asNumber(valueFrom(record, 'ranking', 'rank', 'no')),
          loanCount: asNumber(valueFrom(record, 'loan_count', 'loanCount')),
        };
      })
      .filter((book): book is LoanRankingBook => book !== null);
  }

  async getHotTrend(searchDate: string): Promise<HotTrendBook[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(searchDate)) {
      throw new ProviderError('검색일은 YYYY-MM-DD 형식이어야 합니다.', PROVIDER, 400);
    }
    const payload = await this.request('hotTrend', { searchDt: searchDate });
    const root = asRecord(payload);
    const response = asRecord(root.response ?? root);
    const results = asArray(response.results ?? root.results);
    const books: HotTrendBook[] = [];

    for (const entry of results) {
      const result = asRecord(asRecord(entry).result ?? entry);
      const trendDate = asString(result.date);
      for (const wrapped of asArray(result.docs)) {
        const record = asRecord(asRecord(wrapped).doc ?? wrapped);
        const book = toBook(record);
        if (!book) continue;
        books.push({
          ...book,
          trendDate,
          rank: asNumber(valueFrom(record, 'no', 'ranking', 'rank')),
          rankRise: asNumber(record.difference),
          currentRank: asNumber(record.baseWeekRank),
          previousRank: asNumber(record.pastWeekRank),
        });
      }
    }
    return books;
  }

  async getMonthlyKeywords(month?: string): Promise<WeightedKeyword[]> {
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      throw new ProviderError('검색월은 YYYY-MM 형식이어야 합니다.', PROVIDER, 400);
    }
    const payload = await this.request('monthlyKeywords', { month });
    return unwrapItems(payload, 'keywords', 'keyword')
      .map((record) => ({
        word: asString(valueFrom(record, 'word', 'keyword')),
        weight: asNumber(valueFrom(record, 'weight', 'score')),
      }))
      .filter((keyword) => keyword.word.length > 0);
  }

  async getBookKeywords(isbn13: string): Promise<WeightedKeyword[]> {
    const normalized = normalizeIsbn(isbn13);
    if (!normalized) throw new ProviderError('올바른 ISBN13이 필요합니다.', PROVIDER, 400);
    const payload = await this.request('keywordList', { isbn13: normalized, additionalYN: 'Y' });
    return unwrapItems(payload, 'items', 'item')
      .map((record) => ({
        word: asString(valueFrom(record, 'word', 'keyword')),
        weight: asNumber(valueFrom(record, 'weight', 'score')),
      }))
      .filter((keyword) => keyword.word.length > 0);
  }

  async getBookUsageAnalysis(isbn13: string): Promise<BookUsageAnalysis> {
    const normalized = normalizeIsbn(isbn13);
    if (!normalized) throw new ProviderError('올바른 ISBN13이 필요합니다.', PROVIDER, 400);
    const payload = await this.request('usageAnalysisList', { isbn13: normalized });

    const loanHistory: LoanHistoryPoint[] = findArrays(
      payload,
      new Set(['loanHistory', 'loanHistories']),
    )
      .map((entry) => asRecord(asRecord(entry).loan ?? entry))
      .map((record) => ({
        period: asString(valueFrom(record, 'month', 'yearMonth', 'period', 'date')),
        loanCount: asNumber(valueFrom(record, 'loan_count', 'loanCount', 'count')),
      }))
      .filter((point) => point.period.length > 0);

    const keywords: WeightedKeyword[] = findArrays(payload, new Set(['keywords', 'keywordList']))
      .map((entry) => asRecord(asRecord(entry).keyword ?? asRecord(entry).item ?? entry))
      .map((record) => ({
        word: asString(valueFrom(record, 'word', 'keyword')),
        weight: asNumber(valueFrom(record, 'weight', 'score')),
      }))
      .filter((keyword) => keyword.word.length > 0);

    const relatedBooks = findArrays(payload, new Set(['maniaRecBooks']))
      .map((entry) => asRecord(asRecord(entry).book ?? asRecord(entry).doc ?? entry))
      .map(toBook)
      .filter((book): book is ExternalBook => book !== null);

    return { isbn13: normalized, loanHistory, keywords, relatedBooks, raw: payload };
  }
}
