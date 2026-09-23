import { describe, expect, it } from 'vitest';
import type { Data4CategoryFeed } from './data4Categories';
import { shelvesFromFeed } from './dailySync';

const book = {
  isbn13: '9781234567890',
  title: '정리된 제목',
  author: '저자',
  publisher: '출판사',
  source: 'data4library' as const,
  reason: '선정 이유',
};

describe('daily discovery sync mapping', () => {
  it('stores primary and alternative category books without an arbitrary five-book cap', () => {
    const feed: Data4CategoryFeed = {
      generatedAt: '2026-09-18T00:00:00Z',
      discoveryDate: '2026-09-18',
      source: 'data4library',
      warnings: [],
      categories: [
        {
          slug: 'classics',
          title: '고전',
          description: '설명',
          basis: '근거',
          books: [book],
          alternatives: [{ ...book, isbn13: '9781234567891' }],
        },
      ],
      publisherShelves: [],
      publisherAlternatives: [],
    };
    const shelves = shelvesFromFeed(feed);
    expect(shelves[0].books).toHaveLength(2);
    expect(shelves[0].books.map((item) => item.displayOrder)).toEqual([1, 2]);
  });
});
