import { readFileSync, writeFileSync } from 'node:fs';
import { stdout } from 'node:process';
import { URL } from 'node:url';

const inputPath = new URL('../korean_classics_master_seed.json', import.meta.url);
const outputPath = new URL('../migrations/0017_classic_works.sql', import.meta.url);
const data = JSON.parse(readFileSync(inputPath, 'utf8'));

const sql = (value) =>
  value === null || value === undefined ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const integer = (value) => (value === null || value === undefined ? 'NULL' : String(value));

const lines = [
  `CREATE TABLE classic_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  publisher TEXT,
  source_url TEXT NOT NULL,
  list_mirror_url TEXT,
  verified_via TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`,
  `CREATE TABLE classic_works (
  work_id TEXT PRIMARY KEY,
  title_ko TEXT NOT NULL,
  author_ko TEXT,
  category TEXT NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('work','collection')),
  original_title TEXT,
  first_published_year INTEGER,
  review_status TEXT NOT NULL CHECK (review_status IN ('seed','needs_work_split')),
  source_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`,
  `CREATE TABLE classic_work_sources (
  work_id TEXT NOT NULL REFERENCES classic_works(work_id),
  source_id TEXT NOT NULL REFERENCES classic_sources(id),
  PRIMARY KEY (work_id, source_id)
);`,
  `CREATE TABLE classic_editions (
  work_id TEXT NOT NULL REFERENCES classic_works(work_id),
  isbn13 TEXT NOT NULL REFERENCES books(isbn13),
  match_status TEXT NOT NULL DEFAULT 'verified' CHECK (match_status IN ('candidate','verified','rejected')),
  last_checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (work_id, isbn13)
);`,
  `CREATE TABLE classic_daily_selections (
  discovery_date TEXT NOT NULL,
  work_id TEXT NOT NULL REFERENCES classic_works(work_id),
  isbn13 TEXT REFERENCES books(isbn13),
  status TEXT NOT NULL CHECK (status IN ('selected','matched','unmatched','published')),
  display_order INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (discovery_date, work_id)
);`,
  `CREATE INDEX classic_works_candidate_lookup
  ON classic_works(is_active, record_type, review_status, category, source_order);`,
  `CREATE INDEX classic_daily_recent_lookup
  ON classic_daily_selections(work_id, discovery_date DESC);`,
  '',
  'INSERT INTO classic_sources (id,name,publisher,source_url,list_mirror_url,verified_via) VALUES',
  data.source_catalog
    .map(
      (source, index) =>
        `(${sql(source.id)},${sql(source.name)},${sql(source.publisher)},${sql(source.source_url)},${sql(source.list_mirror_url)},${sql(source.verified_via)})${index === data.source_catalog.length - 1 ? ';' : ','}`,
    )
    .join('\n'),
  '',
  'INSERT INTO classic_works (work_id,title_ko,author_ko,category,record_type,original_title,first_published_year,review_status,source_order,is_active) VALUES',
  data.works
    .map(
      (work, index) =>
        `(${sql(work.work_id)},${sql(work.title_ko)},${sql(work.author_ko)},${sql(work.category)},${sql(work.record_type)},${sql(work.original_title)},${integer(work.first_published_year)},${sql(work.review_status)},${integer(work.source_order)},${work.record_type === 'work' && work.review_status === 'seed' ? 1 : 0})${index === data.works.length - 1 ? ';' : ','}`,
    )
    .join('\n'),
  '',
  'INSERT INTO classic_work_sources (work_id,source_id) VALUES',
  data.works
    .flatMap((work) => work.source_ids.map((sourceId) => [work.work_id, sourceId]))
    .map(
      ([workId, sourceId], index, all) =>
        `(${sql(workId)},${sql(sourceId)})${index === all.length - 1 ? ';' : ','}`,
    )
    .join('\n'),
  '',
];

writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
stdout.write(`Generated ${outputPath.pathname} with ${data.works.length} classic works.\n`);
