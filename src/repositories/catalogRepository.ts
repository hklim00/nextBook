import type {
  Author,
  Book,
  BookMention,
  Collection,
  CollectionBook,
  Person,
  Publisher,
  Source,
} from '../domain/models';
import {
  authors as mockAuthors,
  bookMentions as mockMentions,
  books as mockBooks,
  collectionBooks as mockCollectionBooks,
  collections as mockCollections,
  people as mockPeople,
  publishers as mockPublishers,
  sources as mockSources,
} from '../data/mock';

export interface CatalogSnapshot {
  books: Book[];
  authors: Author[];
  publishers: Publisher[];
  people: Person[];
  sources: Source[];
  mentions: BookMention[];
  collections: Collection[];
  collectionBooks: CollectionBook[];
  storage: 'd1' | 'mock' | 'unavailable';
}

export const mockCatalogSnapshot = (): CatalogSnapshot => ({
  books: mockBooks,
  authors: mockAuthors,
  publishers: mockPublishers,
  people: mockPeople,
  sources: mockSources,
  mentions: mockMentions,
  collections: mockCollections,
  collectionBooks: mockCollectionBooks,
  storage: 'mock',
});

const unavailableCatalogSnapshot = (): CatalogSnapshot => ({
  books: [],
  authors: [],
  publishers: [],
  people: [],
  sources: [],
  mentions: [],
  collections: [],
  collectionBooks: [],
  storage: 'unavailable',
});

type BookRow = {
  id: number;
  isbn13: string;
  title: string;
  subtitle: string | null;
  author_display: string;
  author_id: number | null;
  publisher_id: number | null;
  published_at: string | null;
  cover_url: string | null;
  description: string | null;
  description_source: Book['descriptionSource'];
  page_count: number | null;
  primary_category: string | null;
  metadata_source: Book['metadataSource'];
  review_required: number;
  discovery_active: number;
};

const tones = ['#d77755', '#5c765c', '#4f6d86', '#604f70', '#b76b45', '#426b78'];

export class D1CatalogRepository {
  constructor(private db: D1Database) {}

  async snapshot(): Promise<CatalogSnapshot> {
    const [bookRows, authorRows, publisherRows, collectionRows, collectionBookRows] =
      await Promise.all([
        this.db
          .prepare(
            `SELECT b.*, (SELECT ba.author_id FROM book_authors ba WHERE ba.book_id=b.id ORDER BY ba.role='author' DESC LIMIT 1) author_id
           FROM books b WHERE b.status != 'hidden' ORDER BY b.id`,
          )
          .all<BookRow>(),
        this.db.prepare('SELECT id,name,slug FROM authors ORDER BY id').all<Author>(),
        this.db.prepare('SELECT id,name,slug FROM publishers ORDER BY id').all<Publisher>(),
        this.db
          .prepare(
            `SELECT id,slug,COALESCE(display_title,title) title,
           COALESCE(display_description,description) description,
           collection_type,display_order,basis,source,refreshed_at
           FROM collections WHERE is_active=1 ORDER BY display_order`,
          )
          .all<{
            id: number;
            slug: string;
            title: string;
            description: string | null;
            collection_type: string;
            display_order: number;
            basis: string | null;
            source: string;
            refreshed_at: string | null;
          }>(),
        this.db
          .prepare(
            'SELECT collection_id,book_id,score,reason,display_order FROM collection_books ORDER BY collection_id,display_order',
          )
          .all<{
            collection_id: number;
            book_id: number;
            score: number | null;
            reason: string;
            display_order: number;
          }>(),
      ]);
    if (!bookRows.results.length) throw new Error('D1 catalog is empty');
    return {
      books: bookRows.results.map((row) => ({
        id: row.id,
        isbn13: row.isbn13,
        title: row.title,
        subtitle: row.subtitle ?? undefined,
        authorDisplay: row.author_display,
        authorId: row.author_id ?? 0,
        publisherId: row.publisher_id ?? 0,
        publishedAt: row.published_at ?? '',
        description: row.description ?? '',
        descriptionSource: row.description_source,
        pageCount: row.page_count ?? 0,
        primaryCategory: row.primary_category ?? '미분류',
        coverTone: tones[(row.id - 1) % tones.length],
        coverUrl: row.cover_url ?? undefined,
        metadataSource: row.metadata_source,
        reviewRequired: Boolean(row.review_required),
        discoveryActive: Boolean(row.discovery_active),
      })),
      authors: authorRows.results,
      publishers: publisherRows.results,
      people: [],
      sources: [],
      mentions: [],
      collections: collectionRows.results.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description ?? '',
        collectionType: row.collection_type,
        displayOrder: row.display_order,
        basis: row.basis ?? undefined,
        source: row.source,
        refreshedAt: row.refreshed_at ?? undefined,
      })),
      collectionBooks: collectionBookRows.results.map((row) => ({
        collectionId: row.collection_id,
        bookId: row.book_id,
        score: row.score ?? 0,
        reason: row.reason,
        displayOrder: row.display_order,
      })),
      storage: 'd1',
    };
  }
}

export async function loadCatalog(binding: D1Database | undefined): Promise<CatalogSnapshot> {
  if (!binding) return unavailableCatalogSnapshot();
  try {
    return await new D1CatalogRepository(binding).snapshot();
  } catch (error) {
    console.error('D1 catalog unavailable.', error);
    return unavailableCatalogSnapshot();
  }
}
