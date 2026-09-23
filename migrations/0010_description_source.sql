ALTER TABLE books ADD COLUMN description_source TEXT NOT NULL DEFAULT 'manual'
  CHECK (description_source IN ('data4library','metadata_fallback','manual','mock'));
UPDATE books
SET description_source = CASE
  WHEN metadata_source = 'data4library' THEN 'metadata_fallback'
  WHEN metadata_source = 'mock' THEN 'mock'
  ELSE 'manual'
END;
