import { describe, expect, it, vi } from 'vitest';
import { Data4LibraryProvider } from './data4Library';

describe('Data4LibraryProvider description entities', () => {
  it('decodes HTML entities in the description returned by srchDtlList', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        response: {
          detail: [
            {
              book: {
                bookname: '테스트 도서',
                authors: '테스트 저자',
                publisher: '테스트 출판사',
                publication_year: '2024',
                isbn13: '9781234567890',
                description: '오래된 &lt;기억&gt;을 다시 발견하는 이야기 &amp; 기록',
              },
            },
          ],
        },
      }),
    );
    const provider = new Data4LibraryProvider({ apiKey: 'test-key', fetcher });

    await expect(provider.getBookDetail('9781234567890')).resolves.toMatchObject({
      description: '오래된 <기억>을 다시 발견하는 이야기 & 기록',
    });
  });
});
