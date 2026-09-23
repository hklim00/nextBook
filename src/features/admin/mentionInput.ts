import type { BookMention, CommercialContext, Confidence, RelationType } from '../../domain/models';

export type MentionInput = Omit<BookMention, 'id' | 'verifiedAt'> & { verifiedAt?: string };

const relations: RelationType[] = [
  'recommended',
  'favorite',
  'influential',
  'reading',
  'mentioned',
  'selected',
];
const commercialContexts: CommercialContext[] = [
  'organic',
  'sponsored',
  'gifted',
  'publisher_event',
  'unknown',
];
const confidences: Confidence[] = ['high', 'medium', 'low'];
const organizerTypes = ['publisher', 'bookstore', 'independent', 'other'] as const;

export function parseMentionInput(value: unknown): MentionInput {
  if (!value || typeof value !== 'object') throw new Error('요청 본문이 올바르지 않습니다.');
  const data = value as Record<string, unknown>;
  const bookId = Number(data.bookId);
  const personId = Number(data.personId);
  const sourceId = Number(data.sourceId);
  const contextSummary = typeof data.contextSummary === 'string' ? data.contextSummary.trim() : '';
  if (![bookId, personId, sourceId].every(Number.isInteger))
    throw new Error('책, 인물, 출처를 선택해주세요.');
  if (!relations.includes(data.relationType as RelationType))
    throw new Error('관계 유형이 올바르지 않습니다.');
  if (!commercialContexts.includes(data.commercialContext as CommercialContext))
    throw new Error('상업적 맥락이 올바르지 않습니다.');
  if (!confidences.includes(data.confidence as Confidence))
    throw new Error('신뢰도가 올바르지 않습니다.');
  if (!contextSummary) throw new Error('확인된 맥락을 입력해주세요.');
  const organizerType = organizerTypes.includes(
    data.organizerType as (typeof organizerTypes)[number],
  )
    ? (data.organizerType as MentionInput['organizerType'])
    : undefined;
  return {
    bookId,
    personId,
    sourceId,
    relationType: data.relationType as RelationType,
    commercialContext: data.commercialContext as CommercialContext,
    confidence: data.confidence as Confidence,
    contextSummary,
    verified: data.verified === true,
    disclosureStated:
      typeof data.disclosureStated === 'boolean' ? data.disclosureStated : undefined,
    organizerType,
    voluntaryMention:
      typeof data.voluntaryMention === 'boolean' ? data.voluntaryMention : undefined,
    repeatMentionGroup:
      typeof data.repeatMentionGroup === 'string' && data.repeatMentionGroup.trim()
        ? data.repeatMentionGroup.trim()
        : undefined,
    verifiedAt: data.verified === true ? new Date().toISOString() : undefined,
  };
}
