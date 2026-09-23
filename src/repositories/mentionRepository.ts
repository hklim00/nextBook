import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { Book, BookMention, Person, Source } from '../domain/models';
import type { MentionInput } from '../features/admin/mentionInput';
import {
  bookMentions as bookMentionsTable,
  bookAuthors as bookAuthorsTable,
  books as booksTable,
  people as peopleTable,
  sources as sourcesTable,
} from '../db/schema';

const coverTones = ['#d77755', '#5c765c', '#4f6d86', '#604f70', '#b76b45', '#426b78'];

export interface MentionRepository {
  list(): Promise<BookMention[]>;
  listVerifiedForBook(bookId: number): Promise<BookMention[]>;
  create(input: MentionInput): Promise<BookMention>;
  update(id: number, input: MentionInput): Promise<BookMention | null>;
  setVerified(id: number, verified: boolean): Promise<BookMention | null>;
  delete(id: number): Promise<boolean>;
  listBooks(): Promise<Book[]>;
  listPeople(): Promise<Person[]>;
  listSources(): Promise<Source[]>;
}

export class D1MentionRepository implements MentionRepository {
  private db;
  constructor(binding: D1Database) {
    this.db = drizzle(binding);
  }

  async list() {
    return (await this.db.select().from(bookMentionsTable).orderBy(desc(bookMentionsTable.id))).map(
      mapMention,
    );
  }
  async listVerifiedForBook(bookId: number) {
    return (
      await this.db
        .select()
        .from(bookMentionsTable)
        .where(eq(bookMentionsTable.bookId, bookId))
        .orderBy(desc(bookMentionsTable.id))
    )
      .filter((row) => row.verified)
      .map(mapMention);
  }
  async create(input: MentionInput) {
    const [created] = await this.db.insert(bookMentionsTable).values(toRow(input)).returning();
    return mapMention(created);
  }
  async update(id: number, input: MentionInput) {
    const [updated] = await this.db
      .update(bookMentionsTable)
      .set({ ...toRow(input), updatedAt: new Date().toISOString() })
      .where(eq(bookMentionsTable.id, id))
      .returning();
    return updated ? mapMention(updated) : null;
  }
  async setVerified(id: number, verified: boolean) {
    const [updated] = await this.db
      .update(bookMentionsTable)
      .set({
        verified,
        verifiedAt: verified ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(bookMentionsTable.id, id))
      .returning();
    return updated ? mapMention(updated) : null;
  }
  async delete(id: number) {
    const rows = await this.db
      .delete(bookMentionsTable)
      .where(eq(bookMentionsTable.id, id))
      .returning({ id: bookMentionsTable.id });
    return rows.length > 0;
  }
  async listBooks(): Promise<Book[]> {
    const rows = await this.db
      .select({ book: booksTable, authorId: bookAuthorsTable.authorId })
      .from(booksTable)
      .leftJoin(bookAuthorsTable, eq(booksTable.id, bookAuthorsTable.bookId))
      .orderBy(booksTable.id);
    return rows.map(({ book: row, authorId }) => ({
      id: row.id,
      isbn13: row.isbn13 ?? '',
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      authorDisplay: row.authorDisplay,
      authorId: authorId ?? 0,
      publisherId: row.publisherId ?? 0,
      publishedAt: row.publishedAt ?? '',
      description: row.description ?? '',
      pageCount: row.pageCount ?? 0,
      primaryCategory: row.primaryCategory ?? '',
      coverTone: coverTones[(row.id - 1) % coverTones.length],
      coverUrl: row.coverUrl ?? undefined,
      metadataSource: row.metadataSource as Book['metadataSource'],
      reviewRequired: row.reviewRequired,
    }));
  }
  async listPeople(): Promise<Person[]> {
    return (await this.db.select().from(peopleTable).orderBy(peopleTable.id)).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      occupation: row.occupation ?? '',
      description: row.description ?? '',
    }));
  }
  async listSources(): Promise<Source[]> {
    return (await this.db.select().from(sourcesTable).orderBy(sourcesTable.id)).map((row) => ({
      id: row.id,
      sourceType: row.sourceType,
      title: row.title,
      publisherOrChannel: row.publisherOrChannel ?? '',
      url: row.url,
      publishedAt: row.publishedAt ?? '',
    }));
  }
}

function toRow(input: MentionInput) {
  return {
    bookId: input.bookId,
    personId: input.personId,
    sourceId: input.sourceId,
    relationType: input.relationType,
    commercialContext: input.commercialContext,
    confidence: input.confidence,
    contextSummary: input.contextSummary,
    verified: input.verified,
    verifiedAt: input.verifiedAt ?? null,
    disclosureStated: input.disclosureStated ?? null,
    organizerType: input.organizerType ?? null,
    voluntaryMention: input.voluntaryMention ?? null,
    repeatMentionGroup: input.repeatMentionGroup ?? null,
  };
}

function mapMention(row: typeof bookMentionsTable.$inferSelect): BookMention {
  return {
    id: row.id,
    bookId: row.bookId,
    personId: row.personId,
    sourceId: row.sourceId,
    relationType: row.relationType,
    commercialContext: row.commercialContext,
    confidence: row.confidence,
    contextSummary: row.contextSummary ?? '',
    verified: row.verified,
    verifiedAt: row.verifiedAt ?? undefined,
    disclosureStated: row.disclosureStated ?? undefined,
    organizerType: row.organizerType ?? undefined,
    voluntaryMention: row.voluntaryMention ?? undefined,
    repeatMentionGroup: row.repeatMentionGroup ?? undefined,
  };
}
