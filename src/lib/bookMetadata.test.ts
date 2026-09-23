import { describe, expect, it } from 'vitest';
import { cleanAuthorDisplay, splitBookTitle } from './bookMetadata';

describe('book metadata normalization', () => {
  it('separates a catalog subtitle from the display title', () => {
    expect(splitBookTitle('공부 뇌는 만들어진다 : 평생 공부머리를 결정짓는 뇌 성장 수업')).toEqual({
      title: '공부 뇌는 만들어진다',
      subtitle: '평생 공부머리를 결정짓는 뇌 성장 수업',
    });
  });

  it('keeps the primary author and removes catalog role labels', () => {
    expect(cleanAuthorDisplay('지은이: 한강')).toBe('한강');
    expect(cleanAuthorDisplay('루퍼트 스파이라 지음 ;김주환 옮김')).toBe('루퍼트 스파이라');
    expect(cleanAuthorDisplay('글·그림: 채유리')).toBe('채유리');
  });
});
