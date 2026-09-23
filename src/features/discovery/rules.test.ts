import { describe, expect, it } from 'vitest';
import { books } from '../../data/mock';
import { discoveryWeight, eligibleBooks, explainDiscovery, pickRandomBook } from './rules';
describe('discovery rules', () => {
  it('excludes read, not-interested, and recently seen books', () => {
    const result = eligibleBooks(books, {
      states: [
        { bookId: 1, status: 'read', createdAt: '' },
        { bookId: 2, status: 'not_interested', createdAt: '' },
      ],
      recentlySeen: [3],
    });
    expect(result.some((book) => [1, 2, 3].includes(book.id))).toBe(false);
  });
  it('enforces diversity caps over the last ten exposures', () => {
    const candidate = books[0];
    const exposure = {
      id: 999,
      authorId: candidate.authorId,
      publisherId: candidate.publisherId,
      primaryCategory: candidate.primaryCategory,
    };
    const result = eligibleBooks(books, {
      states: [],
      recentlySeen: [],
      recentExposures: [exposure, exposure],
    });
    expect(result.some((book) => book.authorId === candidate.authorId)).toBe(false);
  });
  it('reduces weight as exposure increases', () => {
    const book = books[0];
    const fresh = discoveryWeight(book, { author: {}, publisher: {}, category: {} });
    const repeated = discoveryWeight(book, {
      author: { [book.authorId]: 2 },
      publisher: { [book.publisherId]: 2 },
      category: { [book.primaryCategory]: 2 },
    });
    expect(repeated).toBeLessThan(fresh);
  });
  it('does not re-show recent books when caps are relaxed', () => {
    expect(
      pickRandomBook(books.slice(0, 2), { states: [], recentlySeen: [1, 2] }, () => 0),
    ).toBeUndefined();
  });
  it('explains a pick with actual recent exposure counts', () => {
    const book = books[0];
    const exposure = {
      id: 999,
      authorId: book.authorId,
      publisherId: 999,
      primaryCategory: book.primaryCategory,
    };
    expect(explainDiscovery(book, [exposure])).toContain('같은 저자 1회');
    expect(explainDiscovery(book, [exposure])).toContain('같은 출판사 0회');
    expect(explainDiscovery(book, [])).toContain('최근 노출 기록이 없어');
  });
});
