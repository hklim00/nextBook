import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { intParam, providerErrorResponse } from '../../../lib/providerResponse';
import { NationalLibraryBookProvider } from '../../../providers/nationalLibrary';

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q')?.trim();
  if (!query) return Response.json({ error: '검색어 q가 필요합니다.' }, { status: 400 });

  try {
    const provider = new NationalLibraryBookProvider({ apiKey: env.NL_API_KEY });
    const items = await provider.searchBooks(query, {
      page: intParam(url.searchParams, 'page', 1, 500),
      pageSize: intParam(url.searchParams, 'pageSize', 20, 100),
    });
    return Response.json({ items, source: 'national_library' });
  } catch (error) {
    return providerErrorResponse(error);
  }
};
