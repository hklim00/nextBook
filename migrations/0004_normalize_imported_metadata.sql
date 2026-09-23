UPDATE books
SET author_display = TRIM(REPLACE(author_display, '지은이:', ''))
WHERE metadata_source = 'data4library' AND author_display LIKE '지은이:%';

UPDATE books
SET title = TRIM(SUBSTR(title, 1, INSTR(title, ':') - 1))
WHERE metadata_source = 'data4library'
  AND INSTR(title, ':') > 0
  AND (
    title LIKE '%장편소설' OR title LIKE '%연작소설' OR title LIKE '%소설집'
    OR title LIKE '%단편집' OR title LIKE '%시집' OR title LIKE '%산문집'
  );

UPDATE books
SET description = (
  SELECT COALESCE(p.name || ' · ', '') FROM publishers p WHERE p.id = books.publisher_id
) || COALESCE(SUBSTR(published_at, 1, 4) || ' · ', '')
  || COALESCE(SUBSTR(primary_category, 1, CASE WHEN INSTR(primary_category, ' > ') > 0 THEN INSTR(primary_category, ' > ') - 1 ELSE LENGTH(primary_category) END) || ' ', '')
  || '판본으로 확인된 도서입니다. 짧은 소개는 관리자 검수 후 추가됩니다.'
WHERE metadata_source = 'data4library' AND (description IS NULL OR TRIM(description) = '');
