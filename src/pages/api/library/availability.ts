import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { providerErrorResponse } from '../../../lib/providerResponse';
import { Data4LibraryProvider } from '../../../providers/data4Library';

export const GET: APIRoute = async ({ url }) => {
  const libraryId = url.searchParams.get('libraryId') ?? '';
  const isbn13 = url.searchParams.get('isbn13') ?? '';
  if (!libraryId || !isbn13) {
    return Response.json({ error: 'libraryId와 isbn13이 필요합니다.' }, { status: 400 });
  }

  try {
    const provider = new Data4LibraryProvider({ apiKey: env.DATA4LIBRARY_API_KEY });
    const item = await provider.checkBookAvailability(libraryId, isbn13);
    return Response.json({
      item,
      source: 'data4library',
      notice: '대출 가능 여부는 조회일 기준 전날 상태이며 실시간 정보가 아닙니다.',
    });
  } catch (error) {
    return providerErrorResponse(error);
  }
};
