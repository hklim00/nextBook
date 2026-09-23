import { ProviderError } from '../providers/http';

export const providerErrorResponse = (error: unknown): Response => {
  if (error instanceof ProviderError) {
    return Response.json(
      { error: error.message, provider: error.provider, code: error.code },
      { status: error.status },
    );
  }
  return Response.json({ error: '외부 데이터 요청을 처리하지 못했습니다.' }, { status: 500 });
};

export const intParam = (
  params: URLSearchParams,
  name: string,
  fallback: number,
  max: number,
): number => {
  const value = Number(params.get(name) ?? fallback);
  if (!Number.isInteger(value) || value < 1) return fallback;
  return Math.min(value, max);
};
