import { describe, expect, it, vi } from 'vitest';
import { GoogleBooksProvider, normalizeGoogleBook } from './googleBooks';

const item = {
  volumeInfo: {
    title: '낯선 책',
    authors: ['김읽음'],
    publisher: '여백',
    publishedDate: '2025-03-01',
    industryIdentifiers: [{ type: 'ISBN_13', identifier: '9781234567890' }],
    categories: ['문학'],
    pageCount: 224,
    imageLinks: { thumbnail: 'http://example.com/cover.jpg' },
  },
};

describe('GoogleBooksProvider', () => {
  it('normalizes a volume and upgrades the cover URL', () => {
    expect(normalizeGoogleBook(item)).toMatchObject({
      isbn13: '9781234567890',
      title: '낯선 책',
      author: '김읽음',
      source: 'google_books',
      coverUrl: 'https://example.com/cover.jpg',
    });
  });

  it('supports metadata lookup without an API key', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL) => {
      void _input;
      return new Response(JSON.stringify({ items: [item] }), { status: 200 });
    });
    const provider = new GoogleBooksProvider({ fetcher: fetcher as typeof fetch });
    expect((await provider.getBookMetadata('9781234567890'))?.title).toBe('낯선 책');
    expect(String(fetcher.mock.calls[0][0])).toContain('q=isbn%3A9781234567890');
  });
});
