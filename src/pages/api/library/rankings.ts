import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { intParam, providerErrorResponse } from '../../../lib/providerResponse';
import { Data4LibraryProvider } from '../../../providers/data4Library';

export const GET: APIRoute = async ({ url }) => {
  const startDate = url.searchParams.get('startDate') ?? '';
  const endDate = url.searchParams.get('endDate') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return Response.json(
      { error: 'startDate와 endDate는 YYYY-MM-DD 형식이어야 합니다.' },
      { status: 400 },
    );
  }

  const gender = url.searchParams.get('gender');
  if (gender && !['0', '1', '2'].includes(gender)) {
    return Response.json({ error: 'gender는 0, 1, 2 중 하나여야 합니다.' }, { status: 400 });
  }

  try {
    const provider = new Data4LibraryProvider({ apiKey: env.DATA4LIBRARY_API_KEY });
    const items = await provider.getLoanRanking({
      startDate,
      endDate,
      gender: gender as '0' | '1' | '2' | undefined,
      fromAge: url.searchParams.has('fromAge')
        ? intParam(url.searchParams, 'fromAge', 0, 120)
        : undefined,
      toAge: url.searchParams.has('toAge')
        ? intParam(url.searchParams, 'toAge', 120, 120)
        : undefined,
      region: url.searchParams.get('region') ?? undefined,
      detailRegion: url.searchParams.get('detailRegion') ?? undefined,
      kdc: url.searchParams.get('kdc') ?? undefined,
      page: intParam(url.searchParams, 'page', 1, 500),
      pageSize: intParam(url.searchParams, 'pageSize', 50, 100),
    });
    return Response.json({ items, source: 'data4library', startDate, endDate });
  } catch (error) {
    return providerErrorResponse(error);
  }
};
