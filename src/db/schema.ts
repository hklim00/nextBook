import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
const timestamps = {
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
};
export const publishers = sqliteTable('publishers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});
export const books = sqliteTable(
  'books',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    isbn13: text('isbn13'),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    authorDisplay: text('author_display').notNull(),
    publisherId: integer('publisher_id').references(() => publishers.id),
    originalPublishedYear: integer('original_published_year'),
    editionPublishedAt: text('edition_published_at'),
    editionType: text('edition_type', {
      enum: ['standard', 'reissue', 'revised', 'new_translation', 'anniversary'],
    })
      .notNull()
      .default('standard'),
    translator: text('translator'),
    publishedAt: text('published_at'),
    coverUrl: text('cover_url'),
    metadataSource: text('metadata_source').notNull().default('manual'),
    reviewRequired: integer('review_required', { mode: 'boolean' }).notNull().default(true),
    discoveryActive: integer('discovery_active', { mode: 'boolean' }).notNull().default(true),
    description: text('description'),
    descriptionSource: text('description_source').notNull().default('manual'),
    shortDescription: text('short_description').notNull().default(''),
    pageCount: integer('page_count'),
    primaryCategory: text('primary_category'),
    workKey: text('work_key'),
    status: text('status', { enum: ['draft', 'published', 'hidden'] })
      .notNull()
      .default('draft'),
    ...timestamps,
  },
  (t) => [uniqueIndex('books_isbn13_unique').on(t.isbn13)],
);
export const authors = sqliteTable('authors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});
export const bookAuthors = sqliteTable(
  'book_authors',
  {
    bookId: integer('book_id')
      .notNull()
      .references(() => books.id),
    authorId: integer('author_id')
      .notNull()
      .references(() => authors.id),
    role: text('role').notNull().default('author'),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.authorId, t.role] })],
);
export const people = sqliteTable('people', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  occupation: text('occupation'),
  profileImageUrl: text('profile_image_url'),
  description: text('description'),
  isFictional: integer('is_fictional', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
});
export const sources = sqliteTable(
  'sources',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sourceType: text('source_type').notNull(),
    title: text('title').notNull(),
    publisherOrChannel: text('publisher_or_channel'),
    url: text('url').notNull(),
    archiveUrl: text('archive_url'),
    publishedAt: text('published_at'),
    accessedAt: text('accessed_at').notNull().default('CURRENT_TIMESTAMP'),
    createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  },
  (table) => [uniqueIndex('sources_url_unique').on(table.url)],
);
export const bookMentions = sqliteTable(
  'book_mentions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    bookId: integer('book_id')
      .notNull()
      .references(() => books.id),
    personId: integer('person_id')
      .notNull()
      .references(() => people.id),
    sourceId: integer('source_id')
      .notNull()
      .references(() => sources.id),
    relationType: text('relation_type', {
      enum: ['recommended', 'favorite', 'influential', 'reading', 'mentioned', 'selected'],
    }).notNull(),
    commercialContext: text('commercial_context', {
      enum: ['organic', 'sponsored', 'gifted', 'publisher_event', 'unknown'],
    })
      .notNull()
      .default('unknown'),
    confidence: text('confidence', { enum: ['high', 'medium', 'low'] })
      .notNull()
      .default('low'),
    contextSummary: text('context_summary'),
    quote: text('quote'),
    verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
    verifiedAt: text('verified_at'),
    disclosureStated: integer('disclosure_stated', { mode: 'boolean' }),
    organizerType: text('organizer_type', {
      enum: ['publisher', 'bookstore', 'independent', 'other'],
    }),
    voluntaryMention: integer('voluntary_mention', { mode: 'boolean' }),
    repeatMentionGroup: text('repeat_mention_group'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('book_mentions_relation_unique').on(
      table.bookId,
      table.personId,
      table.sourceId,
      table.relationType,
    ),
  ],
);
export const collections = sqliteTable('collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  displayTitle: text('display_title'),
  displayDescription: text('display_description'),
  collectionType: text('collection_type').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  basis: text('basis'),
  source: text('source').notNull().default('manual'),
  refreshedAt: text('refreshed_at'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const discoverySyncRuns = sqliteTable('discovery_sync_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  status: text('status', { enum: ['running', 'completed', 'failed'] }).notNull(),
  discoveryDate: text('discovery_date'),
  bookCount: integer('book_count').notNull().default(0),
  collectionCount: integer('collection_count').notNull().default(0),
  errorMessage: text('error_message'),
  startedAt: text('started_at').notNull().default('CURRENT_TIMESTAMP'),
  completedAt: text('completed_at'),
});
export const classicSources = sqliteTable('classic_sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  publisher: text('publisher'),
  sourceUrl: text('source_url').notNull(),
  listMirrorUrl: text('list_mirror_url'),
  verifiedVia: text('verified_via'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});
export const classicWorks = sqliteTable(
  'classic_works',
  {
    workId: text('work_id').primaryKey(),
    titleKo: text('title_ko').notNull(),
    authorKo: text('author_ko'),
    category: text('category').notNull(),
    recordType: text('record_type', { enum: ['work', 'collection'] }).notNull(),
    originalTitle: text('original_title'),
    firstPublishedYear: integer('first_published_year'),
    reviewStatus: text('review_status', { enum: ['seed', 'needs_work_split'] }).notNull(),
    sourceOrder: integer('source_order').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index('classic_works_candidate_lookup').on(
      table.isActive,
      table.recordType,
      table.reviewStatus,
      table.category,
      table.sourceOrder,
    ),
  ],
);
export const classicWorkSources = sqliteTable(
  'classic_work_sources',
  {
    workId: text('work_id')
      .notNull()
      .references(() => classicWorks.workId),
    sourceId: text('source_id')
      .notNull()
      .references(() => classicSources.id),
  },
  (table) => [primaryKey({ columns: [table.workId, table.sourceId] })],
);
export const classicEditions = sqliteTable(
  'classic_editions',
  {
    workId: text('work_id')
      .notNull()
      .references(() => classicWorks.workId),
    isbn13: text('isbn13')
      .notNull()
      .references(() => books.isbn13),
    matchStatus: text('match_status', { enum: ['candidate', 'verified', 'rejected'] })
      .notNull()
      .default('verified'),
    lastCheckedAt: text('last_checked_at').notNull().default('CURRENT_TIMESTAMP'),
  },
  (table) => [primaryKey({ columns: [table.workId, table.isbn13] })],
);
export const classicDailySelections = sqliteTable(
  'classic_daily_selections',
  {
    discoveryDate: text('discovery_date').notNull(),
    workId: text('work_id')
      .notNull()
      .references(() => classicWorks.workId),
    isbn13: text('isbn13').references(() => books.isbn13),
    status: text('status', { enum: ['selected', 'matched', 'unmatched', 'published'] }).notNull(),
    displayOrder: integer('display_order'),
    createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  },
  (table) => [
    primaryKey({ columns: [table.discoveryDate, table.workId] }),
    index('classic_daily_recent_lookup').on(table.workId, table.discoveryDate),
  ],
);
export const collectionBooks = sqliteTable(
  'collection_books',
  {
    collectionId: integer('collection_id')
      .notNull()
      .references(() => collections.id),
    bookId: integer('book_id')
      .notNull()
      .references(() => books.id),
    score: real('score'),
    reason: text('reason').notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.bookId] })],
);
export const bookRankings = sqliteTable('book_rankings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookId: integer('book_id')
    .notNull()
    .references(() => books.id),
  provider: text('provider').notNull(),
  rankingType: text('ranking_type').notNull(),
  rank: integer('rank').notNull(),
  recordedDate: text('recorded_date').notNull(),
  category: text('category'),
});
export const bookRelations = sqliteTable(
  'book_relations',
  {
    bookId: integer('book_id')
      .notNull()
      .references(() => books.id),
    relatedBookId: integer('related_book_id')
      .notNull()
      .references(() => books.id),
    provider: text('provider').notNull().default('data4library'),
    relationType: text('relation_type').notNull().default('usage_analysis'),
    displayOrder: integer('display_order').notNull().default(0),
    refreshedAt: text('refreshed_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.relatedBookId, t.provider] })],
);
export const bookRelationRefreshes = sqliteTable('book_relation_refreshes', {
  bookId: integer('book_id')
    .primaryKey()
    .references(() => books.id),
  provider: text('provider').notNull().default('data4library'),
  status: text('status', { enum: ['completed', 'failed'] }).notNull(),
  refreshedAt: text('refreshed_at').notNull(),
  errorMessage: text('error_message'),
});
export const userLibraries = sqliteTable('user_libraries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  libraryCode: text('library_code').notNull(),
  libraryName: text('library_name').notNull(),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});
