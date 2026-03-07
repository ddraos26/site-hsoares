import { NextResponse } from 'next/server';
import { getAdminCookieName } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.set(getAdminCookieName(), '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
  return response;
}
