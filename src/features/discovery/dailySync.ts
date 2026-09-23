import type { D1PreparedStatement } from '@cloudflare/workers-types';
import type { ExternalBook } from '../../domain/models';
import type { Data4CategoryFeed } from './data4Categories';
import { adultCandidates, buildData4CategoryFeed } from './data4Categories';
import { metadataFallbackDescription } from '../../lib/bookMetadata';
import { Data4LibraryProvider } from '../../providers/data4Library';
import { ensureRelatedBooks } from './relatedBooks';
import type { Book } from '../../domain/models';

interface SyncEnv {
  DB: D1Database;
  DATA4LIBRARY_API_KEY?: string;
}

const DAILY_SYNC_API_BUDGET = 200;
const DETAIL_PREFETCH_LIMIT = 40;
const PUBLISHER_PREFETCH_LIMIT = 4;
const AUTHOR_PREFETCH_LIMIT = 6;
const RELATED_BOOK_PREFETCH_LIMIT = 6;

export interface DailyShelf {
  slug: string;
  title: string;
  description: string;
  collectionType: string;
  basis: string;
  displayOrder: number;
  books: Array<ExternalBook & { reason: string; displayOrder: number }>;
}

const hash = (value: string) => {
  let result = 2166136261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return (result >>> 0).toString(36);
};

export function shelvesFromFeed(feed: Data4CategoryFeed): DailyShelf[] {
  const categoryShelves = feed.categories.map((category, index) => ({
    slug: category.slug,
    title: category.slug === 'daily-serendipity' ? '오늘의 뜻밖의 책' : category.title,
    description: category.description,
    collectionType: category.slug === 'classics' ? 'classic' : 'daily_discovery',
    basis: category.basis,
    displayOrder: index + 1,
    books: [...category.books, ...category.alternatives].map((book, bookIndex) => ({
      ...book,
      displayOrder: bookIndex + 1,
    })),
  }));
  const publisherShelves = [...feed.publisherShelves, ...feed.publisherAlternatives].map(
    (shelf, index) => ({
      slug: `daily-publisher-${hash(shelf.publisher)}`,
      title: `${shelf.publisher}에서 발견`,
      description: shelf.description,
      collectionType: 'publisher_discovery',
      basis: '정보나루 서지 후보 · 저자와 분야 중복 제한',
      displayOrder: categoryShelves.length + index + 1,
      books: shelf.books.map((book, bookIndex) => ({ ...book, displayOrder: bookIndex + 1 })),
    }),
  );
  return [...categoryShelves, ...publisherShelves].filter((shelf) => shelf.books.length > 0);
}

export async function runDailyDiscoverySync(env: SyncEnv, now = new Date(), force = false) {
  const discoveryDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const completed = await env.DB.prepare(
    `SELECT id,book_count,collection_count FROM discovery_sync_runs
     WHERE status='completed' AND discovery_date=? ORDER BY id DESC LIMIT 1`,
  )
    .bind(discoveryDate)
    .first<{ id: number; book_count: number; collection_count: number }>();
  if (completed && !force) {
    return {
      runId: completed.id,
      discoveryDate,
      bookCount: completed.book_count,
      collectionCount: completed.collection_count,
      skipped: true,
    };
  }
  const running = await env.DB.prepare(
    `INSERT INTO discovery_sync_runs (status,started_at) VALUES ('running',?)`,
  )
    .bind(now.toISOString())
    .run();
  const runId = running.meta.last_row_id;
  try {
    const provider = new Data4LibraryProvider({
      apiKey: env.DATA4LIBRARY_API_KEY,
      maxRequests: DAILY_SYNC_API_BUDGET,
    });
    const feed = await buildData4CategoryFeed(provider, now);
    const shelves = shelvesFromFeed(feed);
    if (!shelves.length) throw new Error('저장할 발견 카테고리가 없습니다.');
    const listedBooks = [
      ...new Map(
        shelves.flatMap((shelf) => shelf.books).map((book) => [book.isbn13, book]),
      ).values(),
    ];
    const books = await enrichBooksWithDetails(env.DB, provider, listedBooks);

    await upsertExternalBooks(env.DB, books);
    await prefetchPublisherBooks(env.DB, provider, books);
    await prefetchAuthorBooks(env.DB, provider, books);
    const syncedBooks = await loadBooksByIsbn(
      env.DB,
      books.map((book) => book.isbn13),
    );
    const relatedStart = Number.parseInt(hash(discoveryDate), 36) % Math.max(syncedBooks.length, 1);
    const relatedBatch = Array.from(
      { length: Math.min(RELATED_BOOK_PREFETCH_LIMIT, syncedBooks.length) },
      (_, index) => syncedBooks[(relatedStart + index) % syncedBooks.length]!,
    );
    for (const book of relatedBatch) {
      await ensureRelatedBooks(
        env,
        book,
        {
          provider,
          upsertBooks: upsertExternalBooks,
        },
        now,
      );
    }
    await replaceDailyShelves(env.DB, shelves, feed.generatedAt);
    await env.DB.prepare(
      `UPDATE discovery_sync_runs SET status='completed',discovery_date=?,book_count=?,collection_count=?,completed_at=? WHERE id=?`,
    )
      .bind(feed.discoveryDate, books.length, shelves.length, new Date().toISOString(), runId)
      .run();
    return {
      runId,
      discoveryDate: feed.discoveryDate,
      bookCount: books.length,
      collectionCount: shelves.length,
    };
  } catch (error) {
    await env.DB.prepare(
      `UPDATE discovery_sync_runs SET status='failed',error_message=?,completed_at=? WHERE id=?`,
    )
      .bind(
        error instanceof Error ? error.message.slice(0, 1000) : '알 수 없는 오류',
        new Date().toISOString(),
        runId,
      )
      .run();
    throw error;
  }
}

async function enrichBooksWithDetails(
  db: D1Database,
  provider: Data4LibraryProvider,
  books: ExternalBook[],
): Promise<ExternalBook[]> {
  const cachedDetails = await loadCachedBookDetails(
    db,
    books.map((book) => book.isbn13),
  );
  const enriched: ExternalBook[] = [];
  let requestCount = 0;
  for (const book of books) {
    const cached = cachedDetails.get(book.isbn13);
    if (cached?.description) {
      enriched.push({
        ...book,
        description: cached.description,
        coverUrl: book.coverUrl || cached.coverUrl,
      });
      continue;
    }
    if (requestCount >= DETAIL_PREFETCH_LIMIT) {
      enriched.push(book);
      continue;
    }
    try {
      requestCount += 1;
      const detail = await provider.getBookDetail(book.isbn13);
      enriched.push(
        detail
          ? {
              ...book,
              ...detail,
              description: detail.description?.trim() || book.description,
              coverUrl: detail.coverUrl || book.coverUrl,
            }
          : book,
      );
    } catch (error) {
      console.warn(`Book detail prefetch failed for ${book.isbn13}.`, error);
      enriched.push(book);
    }
  }
  return enriched;
}

async function loadCachedBookDetails(db: D1Database, isbns: string[]) {
  const uniqueIsbns = [...new Set(isbns.filter(Boolean))];
  if (!uniqueIsbns.length) {
    return new Map<string, { description: string; coverUrl?: string }>();
  }
  const placeholders = uniqueIsbns.map(() => '?').join(',');
  const result = await db
    .prepare(
      `SELECT isbn13,description,cover_url FROM books
       WHERE isbn13 IN (${placeholders})
         AND description_source='data4library'
         AND description IS NOT NULL
         AND TRIM(description)<>''`,
    )
    .bind(...uniqueIsbns)
    .all<{ isbn13: string; description: string; cover_url: string | null }>();
  return new Map(
    result.results.map((row) => [
      row.isbn13,
      { description: row.description.trim(), coverUrl: row.cover_url || undefined },
    ]),
  );
}

async function prefetchPublisherBooks(
  db: D1Database,
  provider: Data4LibraryProvider,
  candidateBooks: ExternalBook[],
) {
  const publishers = [
    ...new Set(candidateBooks.map((book) => book.publisher.trim()).filter(Boolean)),
  ].slice(0, PUBLISHER_PREFETCH_LIMIT);
  for (const publisher of publishers) {
    try {
      const books = await provider.browseBooks({
        publisher,
        page: 1,
        pageSize: 5,
        sort: 'pubYear',
        order: 'desc',
      });
      const unique = [
        ...new Map(
          adultCandidates(books)
            .filter((book) => book.isbn13)
            .map((book) => [book.isbn13, book]),
        ).values(),
      ].slice(0, 5);
      await upsertExternalBooks(db, unique, { discoveryActive: false });
    } catch (error) {
      console.warn(`Publisher prefetch failed for ${publisher}.`, error);
    }
  }
}

const normalizedAuthor = (value: string) =>
  value.toLocaleLowerCase('ko-KR').replace(/[^0-9a-z가-힣]/g, '');

async function prefetchAuthorBooks(
  db: D1Database,
  provider: Data4LibraryProvider,
  candidateBooks: ExternalBook[],
) {
  const authors = [
    ...new Set(candidateBooks.map((book) => book.author.trim()).filter(Boolean)),
  ].slice(0, AUTHOR_PREFETCH_LIMIT);
  for (const author of authors) {
    try {
      const books = await provider.searchBooks(author, { page: 1, pageSize: 12 });
      const authorKey = normalizedAuthor(author);
      const unique = [
        ...new Map(
          adultCandidates(books)
            .filter((book) => book.isbn13 && normalizedAuthor(book.author).includes(authorKey))
            .map((book) => [book.isbn13, book]),
        ).values(),
      ].slice(0, 6);
      await upsertExternalBooks(db, unique, { discoveryActive: false });
    } catch (error) {
      console.warn(`Author works prefetch failed for ${author}.`, error);
    }
  }
}

async function loadBooksByIsbn(db: D1Database, isbns: string[]): Promise<Book[]> {
  if (!isbns.length) return [];
  const placeholders = isbns.map(() => '?').join(',');
  const result = await db
    .prepare(
      `SELECT b.id,b.isbn13,b.title,b.subtitle,b.author_display,b.publisher_id,b.published_at,
       b.description,b.page_count,b.primary_category,b.cover_url,b.metadata_source,
       b.review_required,b.discovery_active,
       (SELECT ba.author_id FROM book_authors ba WHERE ba.book_id=b.id AND ba.role='author' LIMIT 1) author_id
       FROM books b WHERE b.isbn13 IN (${placeholders})`,
    )
    .bind(...isbns)
    .all<Record<string, unknown>>();
  return result.results.map((row) => ({
    id: Number(row.id),
    isbn13: String(row.isbn13),
    title: String(row.title),
    subtitle: row.subtitle ? String(row.subtitle) : undefined,
    authorDisplay: String(row.author_display),
    authorId: Number(row.author_id ?? 0),
    publisherId: Number(row.publisher_id ?? 0),
    publishedAt: String(row.published_at ?? ''),
    description: String(row.description ?? ''),
    pageCount: Number(row.page_count ?? 0),
    primaryCategory: String(row.primary_category ?? ''),
    coverTone: '#5c765c',
    coverUrl: row.cover_url ? String(row.cover_url) : undefined,
    metadataSource: row.metadata_source as Book['metadataSource'],
    reviewRequired: Boolean(row.review_required),
    discoveryActive: Boolean(row.discovery_active),
  }));
}

export async function upsertExternalBooks(
  db: D1Database,
  books: ExternalBook[],
  options: { discoveryActive?: boolean } = {},
) {
  if (!books.length) return;
  const discoveryActive = options.discoveryActive === false ? 0 : 1;
  const publishers = new Map(books.map((book) => [book.publisher || '출판사 미상', undefined]));
  const authors = new Map(books.map((book) => [book.author || '저자 미상', undefined]));
  await runBatches(db, [
    ...[...publishers.keys()].map((name) =>
      db
        .prepare(
          `INSERT INTO publishers (name,slug) VALUES (?,?) ON CONFLICT(slug) DO UPDATE SET name=excluded.name`,
        )
        .bind(name, `publisher-${hash(name)}`),
    ),
    ...[...authors.keys()].map((name) =>
      db
        .prepare(
          `INSERT INTO authors (name,slug) VALUES (?,?) ON CONFLICT(slug) DO UPDATE SET name=excluded.name`,
        )
        .bind(name, `author-${hash(name)}`),
    ),
  ]);
  await runBatches(
    db,
    books.map((book) => {
      const publisher = book.publisher || '출판사 미상';
      const author = book.author || '저자 미상';
      return db
        .prepare(
          `INSERT INTO books
      (isbn13,title,subtitle,author_display,publisher_id,published_at,cover_url,description,description_source,page_count,primary_category,metadata_source,review_required,discovery_active,updated_at)
      VALUES (?,?,?,?,(SELECT id FROM publishers WHERE slug=?),?,?,?,?,?,?,'data4library',1,?,CURRENT_TIMESTAMP)
      ON CONFLICT(isbn13) DO UPDATE SET title=excluded.title,subtitle=excluded.subtitle,author_display=excluded.author_display,
      publisher_id=excluded.publisher_id,published_at=excluded.published_at,cover_url=COALESCE(excluded.cover_url,books.cover_url),
      description=CASE
        WHEN books.description IS NULL OR TRIM(books.description)='' OR books.description_source='metadata_fallback'
        THEN excluded.description ELSE books.description END,
      description_source=CASE
        WHEN books.description IS NULL OR TRIM(books.description)='' OR books.description_source='metadata_fallback'
        THEN excluded.description_source ELSE books.description_source END,
      page_count=COALESCE(excluded.page_count,books.page_count),primary_category=COALESCE(excluded.primary_category,books.primary_category),
      metadata_source='data4library',review_required=1,updated_at=CURRENT_TIMESTAMP`,
        )
        .bind(
          book.isbn13,
          book.title,
          book.subtitle ?? null,
          author,
          `publisher-${hash(publisher)}`,
          book.publishedAt ?? null,
          book.coverUrl ?? null,
          book.description ||
            metadataFallbackDescription(publisher, book.publishedAt, book.subject),
          book.description ? 'data4library' : 'metadata_fallback',
          book.pageCount ?? null,
          book.subject ?? null,
          discoveryActive,
        );
    }),
  );
  await runBatches(
    db,
    books.map((book) =>
      db
        .prepare(
          `DELETE FROM book_authors WHERE book_id=(SELECT id FROM books WHERE isbn13=?) AND role='author'`,
        )
        .bind(book.isbn13),
    ),
  );
  await runBatches(
    db,
    books.map((book) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO book_authors (book_id,author_id,role)
      SELECT b.id,a.id,'author' FROM books b,authors a WHERE b.isbn13=? AND a.slug=?`,
        )
        .bind(book.isbn13, `author-${hash(book.author || '저자 미상')}`),
    ),
  );
}

async function replaceDailyShelves(db: D1Database, shelves: DailyShelf[], refreshedAt: string) {
  const activeIsbns = [
    ...new Set(shelves.flatMap((shelf) => shelf.books.map((book) => book.isbn13))),
  ];
  const statements: D1PreparedStatement[] = [
    db.prepare(`UPDATE books SET discovery_active=0 WHERE metadata_source='data4library'`),
    ...activeIsbns.map((isbn13) =>
      db.prepare(`UPDATE books SET discovery_active=1 WHERE isbn13=?`).bind(isbn13),
    ),
    db.prepare(
      `DELETE FROM collection_books WHERE collection_id IN (SELECT id FROM collections WHERE source='data4library')`,
    ),
    ...shelves.map((shelf) =>
      db
        .prepare(
          `INSERT INTO collections
      (slug,title,description,collection_type,is_active,display_order,basis,source,refreshed_at)
      VALUES (?,?,?,?,1,?,?,'data4library',?)
      ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,
      collection_type=excluded.collection_type,is_active=1,display_order=excluded.display_order,
      basis=excluded.basis,source='data4library',refreshed_at=excluded.refreshed_at`,
        )
        .bind(
          shelf.slug,
          shelf.title,
          shelf.description,
          shelf.collectionType,
          shelf.displayOrder,
          shelf.basis,
          refreshedAt,
        ),
    ),
    ...shelves.flatMap((shelf) =>
      shelf.books.map((book) =>
        db
          .prepare(
            `INSERT INTO collection_books (collection_id,book_id,score,reason,display_order)
        SELECT c.id,b.id,NULL,?,? FROM collections c,books b WHERE c.slug=? AND b.isbn13=?`,
          )
          .bind(book.reason, book.displayOrder, shelf.slug, book.isbn13),
      ),
    ),
  ];
  const placeholders = shelves.map(() => '?').join(',');
  statements.push(
    db
      .prepare(
        `DELETE FROM collections WHERE source='data4library' AND slug NOT IN (${placeholders})`,
      )
      .bind(...shelves.map((shelf) => shelf.slug)),
  );
  await db.batch(statements);
}

async function runBatches(db: D1Database, statements: D1PreparedStatement[], size = 50) {
  for (let index = 0; index < statements.length; index += size) {
    await db.batch(statements.slice(index, index + size));
  }
}
