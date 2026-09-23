UPDATE collection_books
SET reason = TRIM(
  SUBSTR(reason, 1, INSTR(reason, ' 선반에서 발견한 뜻밖의 한 권') - 1)
)
WHERE INSTR(reason, ' 선반에서 발견한 뜻밖의 한 권') > 0;
