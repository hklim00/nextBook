UPDATE collections
SET is_active = 0
WHERE source = 'manual'
  AND slug IN ('publisher-find', 'cross-border');

UPDATE collections
SET title = '오늘의 무작위 발견',
    description = '최근 1년 성인 도서 후보에서 순위를 제거하고 분야·저자·출판사가 겹치지 않게 고른 책입니다.',
    basis = 'loanItemSrch 최근 1년 후보 + srchDtlList 상세정보 · 성인서 필터 · 순위 제거 · 날짜별 무작위'
WHERE slug = 'daily-serendipity';

UPDATE collections
SET title = '비문학 분야별 추천',
    description = '문학을 제외하고 서로 다른 KDC 분야에서 고른 성인 도서입니다.',
    basis = 'loanItemSrch 최근 1년 후보 + KDC 비문학 필터 + srchDtlList 상세정보 · 분야/저자/출판사 중복 제한'
WHERE slug = 'outside-literature';
