import { describe, expect, it } from 'vitest';
import { parseCatalogAction } from './catalogInput';

describe('parseCatalogAction', () => {
  it('normalizes an external book import action', () => {
    expect(
      parseCatalogAction({
        action: 'import_collection_book',
        collectionId: '4',
        isbn13: '9781234567890',
        reason: '직접 고른 책',
      }),
    ).toEqual({
      action: 'import_collection_book',
      collectionId: 4,
      isbn13: '9781234567890',
      reason: '직접 고른 책',
    });
  });
  it('normalizes a collection-book curation action', () => {
    expect(
      parseCatalogAction({
        action: 'upsert_collection_book',
        collectionId: '2',
        bookId: 3,
        reason: ' 새 번역 ',
      }),
    ).toEqual({ action: 'upsert_collection_book', collectionId: 2, bookId: 3, reason: '새 번역' });
  });
  it('rejects an empty curation reason', () => {
    expect(() =>
      parseCatalogAction({
        action: 'upsert_collection_book',
        collectionId: 2,
        bookId: 3,
        reason: '',
      }),
    ).toThrow('선정 이유');
  });
});
