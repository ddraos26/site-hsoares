import { NextResponse } from 'next/server';
import { createAdminToken, getAdminCookieName, verifyAdminCredentials } from '@/lib/auth';
import { getClientIp, hasJsonContentType, isAllowedOrigin } from '@/lib/request';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 });
  }

  if (!hasJsonContentType(request)) {
    return NextResponse.json({ error: 'Content-Type inválido.' }, { status: 415 });
  }

  const ip = getClientIp(request);
  const gate = rateLimit({ key: `admin-login:${ip}`, limit: 10, windowMs: 60_000 });
  if (!gate.allowed) {
    return NextResponse.json({ error: 'Muitas tentativas.' }, { status: 429 });
  }

  const body = await request.json();
  const email = String(body?.email || '').trim();
  const password = String(body?.password || '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Credenciais obrigatórias.' }, { status: 400 });
  }

  let valid = false;
  try {
    valid = await verifyAdminCredentials(email, password);
  } catch {
    return NextResponse.json({ error: 'Auth não configurada.' }, { status: 500 });
  }

  if (!valid) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
  }

  const token = await createAdminToken(email);
  const requestUrl = new URL(request.url);
  const isHttps =
    requestUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https';
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminCookieName(), token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 60 * 60 * 12,
    path: '/'
  });

  return response;
}
