UPDATE books
SET metadata_source = 'manual', review_required = 1, updated_at = CURRENT_TIMESTAMP
WHERE metadata_source = 'google_books';
