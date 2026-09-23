export type JsonRecord = Record<string, unknown>;

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly status = 502,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const asRecord = (value: unknown): JsonRecord => (isRecord(value) ? value : {});

export const asString = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';

export const asNumber = (value: unknown): number => {
  const parsed = Number(asString(value).replaceAll(',', ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const asBoolean = (value: unknown): boolean | null => {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  const normalized = asString(value).toUpperCase();
  if (['Y', 'YES', 'TRUE', '1'].includes(normalized)) return true;
  if (['N', 'NO', 'FALSE', '0'].includes(normalized)) return false;
  return null;
};

export const asArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
};

export const unwrapItems = (
  value: unknown,
  collectionKey: string,
  itemKey: string,
): JsonRecord[] => {
  const root = asRecord(value);
  const response = asRecord(root.response ?? root);
  const collection = response[collectionKey] ?? root[collectionKey];
  return asArray(collection)
    .map((item) => {
      const record = asRecord(item);
      return asRecord(record[itemKey] ?? record);
    })
    .filter((item) => Object.keys(item).length > 0);
};

export const normalizeIsbn = (value: unknown): string => {
  const candidates = asString(value).match(/[0-9Xx-]{10,17}/g) ?? [];
  const normalized = candidates
    .map((candidate) => candidate.replaceAll('-', '').toUpperCase())
    .find((candidate) => candidate.length === 13);
  return normalized ?? '';
};

export async function fetchJson(
  provider: string,
  url: URL,
  fetcher: typeof fetch,
  init: RequestInit = { headers: { Accept: 'application/json' } },
): Promise<unknown> {
  let response: Response | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetcher(url, {
        ...init,
        signal: init.signal ?? AbortSignal.timeout(10_000),
      });
      if (response.ok || (response.status !== 429 && response.status < 500)) break;
    } catch (error) {
      lastError = error;
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 300));
  }

  if (!response) {
    throw new ProviderError(
      `${provider}에 연결할 수 없습니다.`,
      provider,
      503,
      lastError instanceof Error ? lastError.message : undefined,
    );
  }

  if (!response.ok) {
    throw new ProviderError(
      `${provider} 요청이 실패했습니다. (${response.status})`,
      provider,
      response.status,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new ProviderError(`${provider} 응답이 JSON이 아닙니다.`, provider);
  }
}

export const requiredKey = (key: string | undefined, provider: string): string => {
  const value = key?.trim();
  if (!value) throw new ProviderError(`${provider} API 키가 설정되지 않았습니다.`, provider, 503);
  return value;
};
