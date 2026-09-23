import { describe, expect, it } from 'vitest';
import { parseMentionInput } from './mentionInput';

const valid = {
  bookId: 1,
  personId: 2,
  sourceId: 3,
  relationType: 'recommended',
  commercialContext: 'organic',
  confidence: 'high',
  contextSummary: '공식 인터뷰에서 책의 영향을 설명했다.',
  verified: false,
};

describe('mention input validation', () => {
  it('preserves required commercial context and confirmed facts', () => {
    const result = parseMentionInput({
      ...valid,
      disclosureStated: true,
      organizerType: 'publisher',
      voluntaryMention: false,
    });
    expect(result.commercialContext).toBe('organic');
    expect(result.disclosureStated).toBe(true);
    expect(result.organizerType).toBe('publisher');
    expect(result.voluntaryMention).toBe(false);
  });

  it('rejects unknown enum values', () => {
    expect(() => parseMentionInput({ ...valid, commercialContext: 'viral' })).toThrow(
      '상업적 맥락',
    );
  });

  it('only creates verifiedAt when a human verifies the relation', () => {
    expect(parseMentionInput(valid).verifiedAt).toBeUndefined();
    expect(parseMentionInput({ ...valid, verified: true }).verifiedAt).toBeTruthy();
  });
});
