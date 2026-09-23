import type { ExternalBook } from '../domain/models';
import type { BookProvider, BookSearchOptions } from './types';
import { asArray, asNumber, asRecord, asString, fetchJson, normalizeIsbn } from './http';

const DEFAULT_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

interface GoogleBooksProviderOptions {
  apiKey?: string;
  fetcher?: typeof fetch;
  baseUrl?: string;
}

export const normalizeGoogleBook = (value: unknown): ExternalBook | null => {
  const volume = asRecord(value);
  const info = asRecord(volume.volumeInfo ?? volume);
  const identifiers = asArray(info.industryIdentifiers).map(asRecord);
  const isbn13 = normalizeIsbn(
    identifiers.find((item) => asString(item.type) === 'ISBN_13')?.identifier,
  );
  const title = asString(info.title);
  if (!isbn13 || !title) return null;
  const imageLinks = asRecord(info.imageLinks);
  const authors = asArray(info.authors).map(asString).filter(Boolean);
  const categories = asArray(info.categories).map(asString).filter(Boolean);
  const pageCount = asNumber(info.pageCount);
  return {
    isbn13,
    title,
    author: authors.join(', '),
    publisher: asString(info.publisher),
    publishedAt: asString(info.publishedDate) || undefined,
    description: asString(info.description) || undefined,
    pageCount: pageCount || undefined,
    subject: categories[0],
    coverUrl: asString(imageLinks.thumbnail).replace('http://', 'https://') || undefined,
    source: 'google_books',
  };
};

export class GoogleBooksProvider implements BookProvider {
  private readonly apiKey?: string;
  private readonly fetcher: typeof fetch;
  private readonly baseUrl: string;

  constructor(options: GoogleBooksProviderOptions = {}) {
    this.apiKey = options.apiKey?.trim() || undefined;
    this.fetcher = options.fetcher ?? fetch;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  }

  private async request(query: string, options: BookSearchOptions = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set(
      'startIndex',
      String((Math.max(1, options.page ?? 1) - 1) * (options.pageSize ?? 20)),
    );
    url.searchParams.set('maxResults', String(Math.min(40, Math.max(1, options.pageSize ?? 20))));
    url.searchParams.set('langRestrict', 'ko');
    if (this.apiKey) url.searchParams.set('key', this.apiKey);
    const payload = asRecord(await fetchJson('Google Books', url, this.fetcher));
    return asArray(payload.items)
      .map(normalizeGoogleBook)
      .filter((book): book is ExternalBook => book !== null);
  }

  searchBooks(query: string, options?: BookSearchOptions) {
    const normalized = query.trim();
    return normalized ? this.request(normalized, options) : Promise.resolve([]);
  }

  async getBookByISBN(isbn13: string) {
    const normalized = normalizeIsbn(isbn13);
    if (!normalized) return null;
    return (
      (await this.request(`isbn:${normalized}`, { pageSize: 10 })).find(
        (book) => book.isbn13 === normalized,
      ) ?? null
    );
  }

  async getBookMetadata(identifier: string) {
    return (
      (await this.getBookByISBN(identifier)) ?? (await this.searchBooks(identifier))[0] ?? null
    );
  }
}

export interface BookMetadataStore {
  findByISBN(isbn13: string): Promise<ExternalBook | null>;
  saveCandidate(book: ExternalBook, needsReview: boolean): Promise<void>;
}

export class BookMetadataService {
  constructor(
    private provider: BookProvider,
    private store: BookMetadataStore,
  ) {}

  async getOrCollect(isbn13: string) {
    const cached = await this.store.findByISBN(isbn13);
    if (cached) return { book: cached, needsReview: false, source: 'cache' as const };
    const book = await this.provider.getBookByISBN(isbn13);
    if (!book) return null;
    const needsReview = !book.author || !book.publisher || !book.publishedAt || !book.coverUrl;
    await this.store.saveCandidate(book, needsReview);
    return { book, needsReview, source: 'provider' as const };
  }
}
