DELETE FROM collection_books
WHERE collection_id IN (
  SELECT id FROM collections WHERE slug IN ('startup-readers-next', 'philosophy-readers-next')
);

DELETE FROM collections
WHERE slug IN ('startup-readers-next', 'philosophy-readers-next');
