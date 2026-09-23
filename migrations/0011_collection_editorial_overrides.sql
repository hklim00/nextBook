ALTER TABLE collections ADD COLUMN display_title TEXT;
ALTER TABLE collections ADD COLUMN display_description TEXT;

UPDATE collections
SET is_active = 0
WHERE source = 'manual'
  AND slug IN ('people-said', 'old-new', 'steady', 'publisher-focus', 'outside-comfort');
