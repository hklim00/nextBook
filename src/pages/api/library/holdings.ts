import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { intParam, providerErrorResponse } from '../../../lib/providerResponse';
import { Data4LibraryProvider } from '../../../providers/data4Library';

export const GET: APIRoute = async ({ url }) => {
  const isbn13 = url.searchParams.get('isbn13') ?? '';
  const region = url.searchParams.get('region') ?? '';
  if (!isbn13 || !region) {
    return Response.json({ error: 'isbn13과 region이 필요합니다.' }, { status: 400 });
  }

  try {
    const provider = new Data4LibraryProvider({ apiKey: env.DATA4LIBRARY_API_KEY });
    const items = await provider.getLibrariesHoldingBook(isbn13, {
      region,
      detailRegion: url.searchParams.get('detailRegion') ?? undefined,
      page: intParam(url.searchParams, 'page', 1, 500),
      pageSize: intParam(url.searchParams, 'pageSize', 20, 100),
    });
    return Response.json({ items, source: 'data4library' });
  } catch (error) {
    return providerErrorResponse(error);
  }
};
