import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { providerErrorResponse } from '../../../../lib/providerResponse';
import { Data4LibraryProvider } from '../../../../providers/data4Library';

export const GET: APIRoute = async ({ params }) => {
  try {
    const provider = new Data4LibraryProvider({ apiKey: env.DATA4LIBRARY_API_KEY });
    const [keywords, usage] = await Promise.all([
      provider.getBookKeywords(params.isbn ?? ''),
      provider.getBookUsageAnalysis(params.isbn ?? ''),
    ]);
    return Response.json({ keywords, usage, source: 'data4library' });
  } catch (error) {
    return providerErrorResponse(error);
  }
};
