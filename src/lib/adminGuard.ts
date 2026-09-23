import type { APIContext } from 'astro';

export function requireAdmin(context: APIContext): Response | null {
  const hostname = new URL(context.request.url).hostname;
  const local = hostname === 'localhost' || hostname === '127.0.0.1';
  const accessAssertion = context.request.headers.get('Cf-Access-Jwt-Assertion');
  if (local || accessAssertion) return null;
  return Response.json(
    { error: '관리자 API는 Cloudflare Access로 보호된 요청만 허용합니다.' },
    { status: 403 },
  );
}
