import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { intParam, providerErrorResponse } from '../../../lib/providerResponse';
import { Data4LibraryProvider } from '../../../providers/data4Library';

export const GET: APIRoute = async ({ url }) => {
  try {
    const provider = new Data4LibraryProvider({ apiKey: env.DATA4LIBRARY_API_KEY });
    const items = await provider.getLibraries({
      query: url.searchParams.get('q') ?? undefined,
      region: url.searchParams.get('region') ?? undefined,
      detailRegion: url.searchParams.get('detailRegion') ?? undefined,
      page: intParam(url.searchParams, 'page', 1, 500),
      pageSize: intParam(url.searchParams, 'pageSize', 20, 100),
    });
    return Response.json({ items, source: 'data4library' });
  } catch (error) {
    return providerErrorResponse(error);
  }
};
