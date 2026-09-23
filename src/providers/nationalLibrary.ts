import type { ExternalBook } from '../domain/models';
import type { BookProvider, BookSearchOptions } from './types';
import {
  asArray,
  asNumber,
  asRecord,
  asString,
  fetchJson,
  normalizeIsbn,
  ProviderError,
  requiredKey,
} from './http';

const PROVIDER = '국립중앙도서관';
const DEFAULT_BASE_URL = 'https://www.nl.go.kr/seoji/SearchApi.do';

interface NationalLibraryProviderOptions {
  apiKey: string | undefined;
  fetcher?: typeof fetch;
  baseUrl?: string;
}

export interface PublicationDateSearch {
  startDate: string;
  endDate: string;
  page?: number;
  pageSize?: number;
  depositedOnly?: boolean;
}

const dateValue = (value: unknown): string | undefined => {
  const raw = asString(value).replaceAll(/[^0-9]/g, '');
  if (raw.length !== 8) return undefined;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

const parseDocs = (payload: unknown): Record<string, unknown>[] => {
  const root = asRecord(payload);
  return asArray(root.docs ?? root.DOCS ?? root.result ?? root.RESULT)
    .map((item) => {
      const record = asRecord(item);
      return asRecord(record.doc ?? record.DOC ?? record);
    })
    .filter((item) => Object.keys(item).length > 0);
};

const toBook = (doc: Record<string, unknown>): ExternalBook | null => {
  const isbn13 = normalizeIsbn(doc.EA_ISBN ?? doc.ea_isbn ?? doc.ISBN);
  const title = asString(doc.TITLE ?? doc.title);
  if (!isbn13 || !title) return null;

  const pageCount = asNumber(doc.PAGE ?? doc.page);
  return {
    isbn13,
    title,
    author: asString(doc.AUTHOR ?? doc.author),
    publisher: asString(doc.PUBLISHER ?? doc.publisher),
    publishedAt: dateValue(doc.PUBLISH_PREDATE ?? doc.publish_predate),
    description:
      asString(doc.BOOK_INTRODUCTION ?? doc.book_introduction) ||
      asString(doc.BOOK_SUMMARY ?? doc.book_summary) ||
      undefined,
    pageCount: pageCount > 0 ? pageCount : undefined,
    kdc: asString(doc.KDC ?? doc.kdc) || undefined,
    ddc: asString(doc.DDC ?? doc.ddc) || undefined,
    subject: asString(doc.SUBJECT ?? doc.subject) || undefined,
    coverUrl: asString(doc.TITLE_URL ?? doc.title_url) || undefined,
    source: 'national_library',
  };
};

export class NationalLibraryBookProvider implements BookProvider {
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;
  private readonly baseUrl: string;

  constructor(options: NationalLibraryProviderOptions) {
    this.apiKey = requiredKey(options.apiKey, PROVIDER);
    this.fetcher = options.fetcher ?? fetch;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  }

  private async request(
    params: Record<string, string | number | undefined>,
  ): Promise<ExternalBook[]> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('cert_key', this.apiKey);
    url.searchParams.set('result_style', 'json');
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }

    const payload = await fetchJson(PROVIDER, url, this.fetcher);
    const root = asRecord(payload);
    const errorCode = asString(root.ERROR_CODE ?? root.errorCode);
    if (errorCode && errorCode !== '000') {
      throw new ProviderError(
        asString(root.ERROR_MESSAGE ?? root.errorMessage) || `${PROVIDER} 오류 (${errorCode})`,
        PROVIDER,
        errorCode === '011' ? 503 : 502,
        errorCode,
      );
    }

    return parseDocs(payload)
      .map(toBook)
      .filter((book): book is ExternalBook => book !== null);
  }

  searchBooks(query: string, options: BookSearchOptions = {}) {
    const title = query.trim();
    if (!title) return Promise.resolve([]);
    return this.request({
      title,
      page_no: Math.max(1, options.page ?? 1),
      page_size: Math.min(100, Math.max(1, options.pageSize ?? 20)),
    });
  }

  async getBookByISBN(isbn13: string) {
    const normalized = normalizeIsbn(isbn13);
    if (!normalized) return null;
    const books = await this.request({ isbn: normalized, page_no: 1, page_size: 10 });
    return books.find((book) => book.isbn13 === normalized) ?? books[0] ?? null;
  }

  async getBookMetadata(identifier: string) {
    return (
      (await this.getBookByISBN(identifier)) ?? (await this.searchBooks(identifier))[0] ?? null
    );
  }

  searchByPublicationDate(query: PublicationDateSearch) {
    const startDate = query.startDate.replaceAll('-', '');
    const endDate = query.endDate.replaceAll('-', '');
    if (!/^\d{8}$/.test(startDate) || !/^\d{8}$/.test(endDate)) {
      throw new ProviderError('발행일은 YYYY-MM-DD 형식이어야 합니다.', PROVIDER, 400);
    }
    return this.request({
      start_publish_date: startDate,
      end_publish_date: endDate,
      deposit_yn: query.depositedOnly === true ? 'Y' : undefined,
      page_no: Math.max(1, query.page ?? 1),
      page_size: Math.min(100, Math.max(1, query.pageSize ?? 20)),
      sort: 'PUBLISH_PREDATE',
      order_by: 'DESC',
    });
  }
}
