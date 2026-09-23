import type { Book } from '../../domain/models';
import { Data4LibraryProvider } from '../../providers/data4Library';
import { isAdultCandidate } from './data4Categories';
import type { ExternalBook } from '../../domain/models';

interface RelatedBookEnv {
  DB: D1Database;
  DATA4LIBRARY_API_KEY?: string;
}

export async function ensureRelatedBooks(
  env: RelatedBookEnv,
  book: Book,
  options: {
    provider?: Data4LibraryProvider;
    upsertBooks: (
      db: D1Database,
      books: ExternalBook[],
      options: { discoveryActive: boolean },
    ) => Promise<void>;
  },
  now = new Date(),
): Promise<void> {
  if (!book.isbn13 || book.metadataSource === 'mock') return;

  const refresh = await env.DB.prepare(
    `SELECT status,refreshed_at FROM book_relation_refreshes WHERE book_id=?`,
  )
    .bind(book.id)
    .first<{ status: string; refreshed_at: string }>();

  if (refresh?.refreshed_at && (refresh.status === 'completed' || refresh.status === 'failed')) {
    const age = new Date(now).getTime() - new Date(refresh.refreshed_at).getTime();
    const retryAfter = refresh.status === 'completed' ? 86_400_000 : 259_200_000;
    if (age < retryAfter) return;
  }

  const refreshedAt = now.toISOString();
  try {
    const provider =
      options.provider ?? new Data4LibraryProvider({ apiKey: env.DATA4LIBRARY_API_KEY });
    const usage = await provider.getBookUsageAnalysis(book.isbn13);
    const recommendations = [
      ...new Map(usage.relatedBooks.map((candidate) => [candidate.isbn13, candidate])).values(),
    ];
    const related: ExternalBook[] = [];
    for (const candidate of recommendations) {
      if (related.length >= 5) break;
      try {
        const detail = await provider.getBookDetail(candidate.isbn13);
        const enriched = detail
          ? {
              ...candidate,
              ...detail,
              description: detail.description?.trim() || candidate.description,
              coverUrl: detail.coverUrl || candidate.coverUrl,
            }
          : candidate;
        if (isAdultCandidate(enriched)) related.push(enriched);
      } catch (error) {
        console.warn(`Related book detail prefetch failed for ${candidate.isbn13}.`, error);
      }
    }

    await options.upsertBooks(env.DB, related, { discoveryActive: false });
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM book_relations WHERE book_id=? AND provider='data4library'`).bind(
        book.id,
      ),
      ...related.map((candidate, index) =>
        env.DB.prepare(
          `INSERT INTO book_relations
          (book_id,related_book_id,provider,relation_type,display_order,refreshed_at)
          SELECT ?,id,'data4library','recommendation',?,? FROM books WHERE isbn13=?`,
        ).bind(book.id, index + 1, refreshedAt, candidate.isbn13),
      ),
      env.DB.prepare(
        `INSERT INTO book_relation_refreshes (book_id,provider,status,refreshed_at,error_message)
         VALUES (?,'data4library','completed',?,NULL)
         ON CONFLICT(book_id) DO UPDATE SET provider='data4library',status='completed',
         refreshed_at=excluded.refreshed_at,error_message=NULL`,
      ).bind(book.id, refreshedAt),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : 'Unknown error';
    await env.DB.prepare(
      `INSERT INTO book_relation_refreshes (book_id,provider,status,refreshed_at,error_message)
       VALUES (?,'data4library','failed',?,?)
       ON CONFLICT(book_id) DO UPDATE SET provider='data4library',status='failed',
       refreshed_at=excluded.refreshed_at,error_message=excluded.error_message`,
    )
      .bind(book.id, refreshedAt, message)
      .run();
    console.warn(`Related books refresh failed for ${book.isbn13}.`, error);
  }
}

export async function loadRelatedBookIds(db: D1Database, bookId: number): Promise<number[]> {
  const result = await db
    .prepare(
      `SELECT related_book_id FROM book_relations
       WHERE book_id=? AND provider='data4library' ORDER BY display_order`,
    )
    .bind(bookId)
    .all<{ related_book_id: number }>();
  return result.results.map((row) => row.related_book_id);
}
