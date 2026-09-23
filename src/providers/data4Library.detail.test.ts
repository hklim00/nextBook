import { describe, expect, it, vi } from 'vitest';
import { Data4LibraryProvider } from './data4Library';

describe('Data4LibraryProvider book detail', () => {
  it('keeps the description supplied by srchDtlList', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        response: {
          detail: [
            {
              book: {
                bookname: '낯선 책',
                authors: '새로운 저자',
                publisher: '새로운 출판사',
                publication_year: '2024',
                isbn13: '9781234567890',
                description: '  한 사람이 낯선 도시에서 오래된 편지를 발견하는 이야기.  ',
              },
            },
          ],
        },
      }),
    );
    const provider = new Data4LibraryProvider({ apiKey: 'test-key', fetcher });

    await expect(provider.getBookDetail('9781234567890')).resolves.toMatchObject({
      isbn13: '9781234567890',
      description: '한 사람이 낯선 도시에서 오래된 편지를 발견하는 이야기.',
    });
    const calledUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe('/api/srchDtlList');
    expect(calledUrl.searchParams.get('loaninfoYN')).toBe('Y');
    expect(calledUrl.searchParams.get('displayInfo')).toBe('age');
  });
});
