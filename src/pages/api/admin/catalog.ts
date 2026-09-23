import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { parseCatalogAction } from '../../../features/admin/catalogInput';
import { requireAdmin } from '../../../lib/adminGuard';
import { Data4LibraryProvider } from '../../../providers/data4Library';
import { upsertExternalBooks } from '../../../features/discovery/dailySync';

export const POST: APIRoute = async (context) => {
  const denied = requireAdmin(context);
  if (denied) return denied;
  try {
    const input = parseCatalogAction(await context.request.json());
    if (input.action === 'update_book') {
      await env.DB.prepare(
        'UPDATE books SET title=?, author_display=?, description=?, publisher_id=?, published_at=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      )
        .bind(
          input.title,
          input.authorDisplay,
          input.description,
          input.publisherId,
          input.publishedAt,
          input.id,
        )
        .run();
    } else if (input.action === 'create_source') {
      await env.DB.prepare(
        'INSERT INTO sources (source_type,title,publisher_or_channel,url,published_at,accessed_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)',
      )
        .bind(input.sourceType, input.title, input.publisherOrChannel, input.url, input.publishedAt)
        .run();
    } else if (input.action === 'create_collection') {
      await env.DB.prepare(
        `INSERT INTO collections
         (slug,title,description,collection_type,is_active,display_order,basis,source,refreshed_at)
         VALUES (?,?,?, ?,1,(SELECT COALESCE(MAX(display_order),0)+1 FROM collections),'관리자가 직접 선정한 추천','manual',CURRENT_TIMESTAMP)`,
      )
        .bind(input.slug, input.title, input.description, input.collectionType)
        .run();
    } else if (input.action === 'update_collection') {
      await env.DB.prepare(
        `UPDATE collections SET title=?,description=?,display_order=?,is_active=?,refreshed_at=CURRENT_TIMESTAMP
         WHERE id=? AND source='manual'`,
      )
        .bind(input.title, input.description, input.displayOrder, input.isActive ? 1 : 0, input.id)
        .run();
    } else if (input.action === 'update_collection_override') {
      await env.DB.prepare(
        `UPDATE collections SET display_title=?,display_description=?,refreshed_at=CURRENT_TIMESTAMP
         WHERE id=? AND source='data4library'`,
      )
        .bind(input.title, input.description, input.id)
        .run();
    } else if (input.action === 'upsert_collection_book') {
      await env.DB.prepare(
        `INSERT INTO collection_books (collection_id,book_id,reason,display_order)
        VALUES (?,?,?,(SELECT COALESCE(MAX(display_order),0)+1 FROM collection_books WHERE collection_id=?))
        ON CONFLICT(collection_id,book_id) DO UPDATE SET reason=excluded.reason`,
      )
        .bind(input.collectionId, input.bookId, input.reason, input.collectionId)
        .run();
    } else if (input.action === 'import_collection_book') {
      const provider = new Data4LibraryProvider({ apiKey: env.DATA4LIBRARY_API_KEY });
      const book = await provider.getBookDetail(input.isbn13);
      if (!book) throw new Error('정보나루에서 해당 책의 상세정보를 찾지 못했습니다.');
      await upsertExternalBooks(env.DB, [book], { discoveryActive: false });
      const result = await env.DB.prepare(
        `INSERT INTO collection_books (collection_id,book_id,reason,display_order)
         SELECT c.id,b.id,?,(SELECT COALESCE(MAX(display_order),0)+1 FROM collection_books WHERE collection_id=c.id)
         FROM collections c,books b
         WHERE c.id=? AND c.source='manual' AND b.isbn13=?
         ON CONFLICT(collection_id,book_id) DO UPDATE SET reason=excluded.reason`,
      )
        .bind(input.reason, input.collectionId, book.isbn13)
        .run();
      if (!result.meta.changes) throw new Error('관리자 추천 카테고리를 찾지 못했습니다.');
    } else {
      await env.DB.prepare(
        `DELETE FROM collection_books
         WHERE collection_id=? AND book_id=?
           AND collection_id IN (SELECT id FROM collections WHERE source='manual')`,
      )
        .bind(input.collectionId, input.bookId)
        .run();
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '저장하지 못했습니다.' },
      { status: 400 },
    );
  }
};
