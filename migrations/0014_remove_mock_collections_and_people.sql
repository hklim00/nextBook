DELETE FROM collection_books
WHERE collection_id IN (
  SELECT id FROM collections
  WHERE slug IN ('people-said', 'old-new', 'steady', 'publisher-find', 'cross-border')
);

DELETE FROM collections
WHERE slug IN ('people-said', 'old-new', 'steady', 'publisher-find', 'cross-border');

DELETE FROM book_mentions;
DELETE FROM people;
