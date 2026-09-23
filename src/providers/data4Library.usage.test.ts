import { describe, expect, it, vi } from 'vitest';
import { Data4LibraryProvider } from './data4Library';

const wrappedBook = (isbn13: string, bookname: string) => ({
  book: {
    bookname,
    authors: '저자',
    publisher: '출판사',
    publication_year: '2024',
    isbn13,
  },
});

describe('Data4LibraryProvider usage analysis', () => {
  it('uses only maniaRecBooks as related recommendations', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        response: {
          coLoanBooks: [wrappedBook('9781234567891', '함께 빌린 책')],
          maniaRecBooks: [wrappedBook('9781234567892', '마니아 추천 책')],
          readerRecBooks: [wrappedBook('9781234567893', '다독자 추천 책')],
        },
      }),
    );
    const provider = new Data4LibraryProvider({ apiKey: 'test-key', fetcher });

    const usage = await provider.getBookUsageAnalysis('9781234567890');

    expect(usage.relatedBooks.map((book) => book.isbn13)).toEqual(['9781234567892']);
    const calledUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe('/api/usageAnalysisList');
  });
});
