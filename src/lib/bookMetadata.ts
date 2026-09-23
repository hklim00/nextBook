export const splitBookTitle = (value: string): { title: string; subtitle?: string } => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  const separator = normalized.search(/\s*:\s*/u);
  if (separator < 1) return { title: normalized };
  const title = normalized.slice(0, separator).trim();
  const subtitle = normalized
    .slice(separator)
    .replace(/^\s*:\s*/u, '')
    .trim();
  return subtitle ? { title, subtitle } : { title };
};

export const cleanBookTitle = (value: string): string => splitBookTitle(value).title;

export const cleanAuthorDisplay = (value: string): string =>
  value
    .split(/\s*;\s*/u)[0]
    .replace(/^(?:지은이|글[· ]?그림|글|저자|엮은이|옮긴이|역자)\s*:\s*/u, '')
    .replace(/\s+(?:지음|글|그림|엮음|옮김)$/u, '')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizePublishedDate = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length >= 8)
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  if (digits.length >= 4) return digits.slice(0, 4);
  return value.trim() || undefined;
};

export const metadataFallbackDescription = (
  publisher: string,
  publishedAt?: string,
  subject?: string,
): string => {
  const parts = [publisher, publishedAt?.slice(0, 4), subject?.split(' > ')[0]].filter(Boolean);
  return `${parts.join(' · ')} 판본으로 확인된 도서입니다. 짧은 소개는 관리자 검수 후 추가됩니다.`;
};
