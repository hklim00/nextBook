import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdmin } from '../../../../lib/adminGuard';
import { providerErrorResponse } from '../../../../lib/providerResponse';
import { Data4LibraryProvider } from '../../../../providers/data4Library';

export const GET: APIRoute = async (context) => {
  const denied = requireAdmin(context);
  if (denied) return denied;
  const query = context.url.searchParams.get('q')?.trim();
  if (!query) return Response.json({ error: '책 제목이나 작가명을 입력하세요.' }, { status: 400 });
  try {
    const provider = new Data4LibraryProvider({ apiKey: env.DATA4LIBRARY_API_KEY });
    const items = await provider.searchBooks(query, { page: 1, pageSize: 12 });
    return Response.json({ items, source: 'data4library' });
  } catch (error) {
    return providerErrorResponse(error);
  }
};
