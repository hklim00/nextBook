import type { CommercialContext, RelationType } from './models';
export const relationLabels: Record<RelationType, string> = {
  recommended: '추천',
  favorite: '좋아함',
  influential: '영향받음',
  reading: '읽는 중',
  mentioned: '언급',
  selected: '선정',
};
export const commercialLabels: Record<CommercialContext, string> = {
  organic: '자발적 언급',
  sponsored: '협찬',
  gifted: '도서 제공',
  publisher_event: '출판사 행사',
  unknown: '상업적 맥락 미확인',
};
