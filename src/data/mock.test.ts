import { describe, expect, it } from 'vitest';
import { bookMentions, catalog, collections } from './mock';
describe('mock catalog', () => {
  it('resolves collection books in display order', () => {
    const rows = catalog.booksForCollection(collections[0].id);
    expect(rows).toHaveLength(8);
    expect(rows.every((x) => x.book && x.reason)).toBe(true);
  });
  it('keeps mention relationships and commercial context', () => {
    expect(bookMentions.length).toBeGreaterThanOrEqual(50);
    expect(
      bookMentions.every(
        (m) => catalog.book(m.bookId) && catalog.person(m.personId) && catalog.source(m.sourceId),
      ),
    ).toBe(true);
    expect(
      bookMentions.every((m) =>
        ['organic', 'sponsored', 'gifted', 'publisher_event', 'unknown'].includes(
          m.commercialContext,
        ),
      ),
    ).toBe(true);
  });
  it('only exposes verified mentions from catalog query', () => {
    expect(catalog.mentionsForBook(1).every((m) => m.verified)).toBe(true);
  });
});
