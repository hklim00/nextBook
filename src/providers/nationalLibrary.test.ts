import { describe, expect, it, vi } from 'vitest';
import { NationalLibraryBookProvider } from './nationalLibrary';

describe('NationalLibraryBookProvider', () => {
  it('첨부 가이드의 ISBN 서지 필드를 공통 도서 모델로 변환한다', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        PAGE_NO: '1',
        TOTAL_COUNT: '1',
        docs: [
          {
            doc: {
              TITLE: '채식주의자',
              AUTHOR: '한강',
              EA_ISBN: '9788936433598',
              PUBLISHER: '창비',
              PAGE: '247',
              KDC: '813.7',
              SUBJECT: '한국 소설',
              PUBLISH_PREDATE: '20071030',
              TITLE_URL: 'https://example.test/cover.jpg',
              BOOK_INTRODUCTION: '한강 장편소설',
            },
          },
        ],
      }),
    );
    const provider = new NationalLibraryBookProvider({ apiKey: 'test-key', fetcher });

    await expect(provider.getBookByISBN('978-89-364-3359-8')).resolves.toMatchObject({
      isbn13: '9788936433598',
      title: '채식주의자',
      author: '한강',
      pageCount: 247,
      kdc: '813.7',
      publishedAt: '2007-10-30',
      source: 'national_library',
    });

    const calledUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(calledUrl.searchParams.get('cert_key')).toBe('test-key');
    expect(calledUrl.searchParams.get('result_style')).toBe('json');
    expect(calledUrl.searchParams.get('isbn')).toBe('9788936433598');
  });

  it('검색어와 페이지 상한을 안전하게 전달한다', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ docs: [] }));
    const provider = new NationalLibraryBookProvider({ apiKey: 'test-key', fetcher });
    await provider.searchBooks('토지', { page: 2, pageSize: 999 });

    const calledUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(calledUrl.searchParams.get('title')).toBe('토지');
    expect(calledUrl.searchParams.get('page_no')).toBe('2');
    expect(calledUrl.searchParams.get('page_size')).toBe('100');
  });
});
