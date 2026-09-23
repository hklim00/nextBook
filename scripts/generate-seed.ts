import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  bookMentions,
  books,
  authors,
  collectionBooks,
  collections,
  people,
  publishers,
  sources,
} from '../src/data/mock';

const sql = (value: unknown): string => {
  if (value === undefined || value === null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
};

const insert = (table: string, columns: string[], rows: unknown[][]) =>
  `INSERT INTO ${table} (${columns.join(',')}) VALUES\n${rows
    .map((row) => `(${row.map(sql).join(',')})`)
    .join(',\n')};`;

const statements = [
  '-- Generated from src/data/mock.ts. Do not edit by hand.',
  'PRAGMA foreign_keys = ON;',
  'DELETE FROM collection_books;',
  'DELETE FROM book_mentions;',
  'DELETE FROM collections;',
  'DELETE FROM sources;',
  'DELETE FROM people;',
  'DELETE FROM book_authors;',
  'DELETE FROM books;',
  'DELETE FROM authors;',
  'DELETE FROM publishers;',
  insert(
    'publishers',
    ['id', 'name', 'slug'],
    publishers.map((item) => [item.id, item.name, item.slug]),
  ),
  insert(
    'authors',
    ['id', 'name', 'slug'],
    authors.map((item) => [item.id, item.name, item.slug]),
  ),
  insert(
    'books',
    [
      'id',
      'isbn13',
      'title',
      'subtitle',
      'author_display',
      'publisher_id',
      'published_at',
      'description',
      'page_count',
      'primary_category',
      'metadata_source',
      'review_required',
    ],
    books.map((item) => [
      item.id,
      item.isbn13,
      item.title,
      item.subtitle,
      item.authorDisplay,
      item.publisherId,
      item.publishedAt,
      item.description,
      item.pageCount,
      item.primaryCategory,
      'mock',
      false,
    ]),
  ),
  insert(
    'book_authors',
    ['book_id', 'author_id', 'role'],
    books.map((item) => [item.id, item.authorId, 'author']),
  ),
  insert(
    'people',
    ['id', 'name', 'slug', 'occupation', 'description'],
    people.map((item) => [item.id, item.name, item.slug, item.occupation, item.description]),
  ),
  insert(
    'sources',
    ['id', 'source_type', 'title', 'publisher_or_channel', 'url', 'published_at'],
    sources.map((item) => [
      item.id,
      item.sourceType,
      item.title,
      item.publisherOrChannel,
      item.url,
      item.publishedAt,
    ]),
  ),
  insert(
    'book_mentions',
    [
      'id',
      'book_id',
      'person_id',
      'source_id',
      'relation_type',
      'commercial_context',
      'confidence',
      'context_summary',
      'verified',
      'verified_at',
      'disclosure_stated',
      'organizer_type',
      'voluntary_mention',
      'repeat_mention_group',
    ],
    bookMentions.map((item) => [
      item.id,
      item.bookId,
      item.personId,
      item.sourceId,
      item.relationType,
      item.commercialContext,
      item.confidence,
      item.contextSummary,
      item.verified,
      item.verifiedAt,
      item.disclosureStated,
      item.organizerType,
      item.voluntaryMention,
      item.repeatMentionGroup,
    ]),
  ),
  insert(
    'collections',
    ['id', 'slug', 'title', 'description', 'collection_type', 'is_active', 'display_order'],
    collections.map((item) => [
      item.id,
      item.slug,
      item.title,
      item.description,
      item.collectionType,
      true,
      item.displayOrder,
    ]),
  ),
  insert(
    'collection_books',
    ['collection_id', 'book_id', 'score', 'reason', 'display_order'],
    collectionBooks.map((item) => [
      item.collectionId,
      item.bookId,
      item.score,
      item.reason,
      item.displayOrder,
    ]),
  ),
  '',
];

writeFileSync(resolve('src/db/seed.sql'), statements.join('\n\n'), 'utf8');
console.log(
  `Generated seed: ${books.length} books, ${people.length} people, ${sources.length} sources, ${bookMentions.length} mentions.`,
);
