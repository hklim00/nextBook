import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { providerErrorResponse } from '../../../../lib/providerResponse';
import { NationalLibraryBookProvider } from '../../../../providers/nationalLibrary';

export const GET: APIRoute = async ({ params }) => {
  try {
    const provider = new NationalLibraryBookProvider({ apiKey: env.NL_API_KEY });
    const item = await provider.getBookByISBN(params.isbn ?? '');
    return item
      ? Response.json({ item, source: 'national_library' })
      : Response.json({ error: '도서를 찾을 수 없습니다.' }, { status: 404 });
  } catch (error) {
    return providerErrorResponse(error);
  }
};
