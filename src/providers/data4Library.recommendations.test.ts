import { describe, expect, it, vi } from 'vitest';
import { Data4LibraryProvider } from './data4Library';

describe('Data4LibraryProvider recommendations', () => {
  it('keeps cover URLs supplied by recommandList', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        response: {
          docs: [
            {
              book: {
                bookname: '이어지는 책',
                authors: '저자',
                publisher: '출판사',
                publication_year: '2024',
                isbn13: '9781234567891',
                bookImageURL: 'http://example.test/cover.jpg',
              },
            },
          ],
        },
      }),
    );
    const provider = new Data4LibraryProvider({ apiKey: 'test-key', fetcher });

    await expect(provider.getRecommendedBooks('9781234567890')).resolves.toEqual([
      expect.objectContaining({
        isbn13: '9781234567891',
        coverUrl: 'https://example.test/cover.jpg',
      }),
    ]);
    const calledUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe('/api/recommandList');
    expect(calledUrl.searchParams.get('type')).toBe('mania');
  });
});
