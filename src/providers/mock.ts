import { books, sources } from '../data/mock';
import type { BookProvider, ContentSourceProvider, LibraryProvider } from './types';

const toExternalBook = (book: (typeof books)[number]) => ({
  isbn13: book.isbn13,
  title: book.title,
  author: book.authorDisplay,
  publisher: '가상 출판사',
  publishedAt: book.publishedAt,
  description: book.description,
  pageCount: book.pageCount,
  subject: book.primaryCategory,
  source: 'national_library' as const,
});

export class MockBookProvider implements BookProvider {
  async searchBooks(q: string) {
    const s = q.toLowerCase();
    return books
      .filter((b) => `${b.title} ${b.authorDisplay}`.toLowerCase().includes(s))
      .map(toExternalBook);
  }
  async getBookByISBN(isbn13: string) {
    const book = books.find((b) => b.isbn13 === isbn13);
    return book ? toExternalBook(book) : null;
  }
  async getBookMetadata(identifier: string) {
    return (
      (await this.getBookByISBN(identifier)) ?? (await this.searchBooks(identifier))[0] ?? null
    );
  }
}
export class MockContentSourceProvider implements ContentSourceProvider {
  async findCandidates(q: string) {
    return sources.filter((s) => s.title.includes(q));
  }
}
export class MockLibraryProvider implements LibraryProvider {
  async getLibraries() {
    return [{ id: 'mock-1', name: '동네도서관 (예시)', region: '서울' }];
  }
  async checkBookAvailability(libraryId: string, isbn13: string) {
    return {
      libraryId,
      isbn13,
      held: false,
      available: null,
      checkedAt: new Date().toISOString(),
      basis: 'previous_day' as const,
    };
  }
  async getLibrariesHoldingBook() {
    return [];
  }
  async getLibraryItems() {
    return [];
  }
  async searchBooks(q: string) {
    const s = q.toLowerCase();
    return books
      .filter((b) => `${b.title} ${b.authorDisplay}`.toLowerCase().includes(s))
      .map((book) => ({ ...toExternalBook(book), source: 'data4library' as const }));
  }
  async browseBooks() {
    return books.map((book) => ({ ...toExternalBook(book), source: 'data4library' as const }));
  }
  async getLoanRanking() {
    return books.slice(0, 5).map((book, index) => ({
      ...toExternalBook(book),
      source: 'data4library' as const,
      rank: index + 1,
      loanCount: 100 - index * 7,
    }));
  }
  async getHotTrend() {
    return [];
  }
  async getMonthlyKeywords() {
    return [];
  }
  async getBookKeywords() {
    return [];
  }
  async getBookUsageAnalysis(isbn13: string) {
    return { isbn13, loanHistory: [], keywords: [], relatedBooks: [], raw: {} };
  }
  async getBookDetail(isbn13: string) {
    const book = books.find((candidate) => candidate.isbn13 === isbn13);
    return book ? { ...toExternalBook(book), source: 'data4library' as const } : null;
  }
}
