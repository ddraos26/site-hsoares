import { NextResponse } from 'next/server';
import { registerEventInDb } from '@/lib/analytics';
import { getDb } from '@/lib/db';
import { getClientIp, hasJsonContentType, isAllowedOrigin } from '@/lib/request';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = new Set(['page_view', 'porto_click', 'lead_submit', 'heartbeat']);

function sanitize(value) {
  return String(value || '').trim();
}

export async function POST(request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 });
  }

  if (!hasJsonContentType(request)) {
    return NextResponse.json({ error: 'Content-Type inválido.' }, { status: 415 });
  }

  const ip = getClientIp(request);
  const gate = rateLimit({ key: `track:${ip}`, limit: 80, windowMs: 60_000 });
  if (!gate.allowed) {
    return NextResponse.json({ error: 'Limite excedido.' }, { status: 429 });
  }

  const body = await request.json();
  const eventType = sanitize(body?.eventType);

  if (!ALLOWED_EVENTS.has(eventType)) {
    return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 });
  }

  const event = {
    eventType,
    pagePath: sanitize(body?.pagePath),
    productSlug: sanitize(body?.productSlug),
    clickId: sanitize(body?.clickId),
    sessionId: sanitize(body?.sessionId),
    utmSource: sanitize(body?.utm_source),
    utmMedium: sanitize(body?.utm_medium),
    utmCampaign: sanitize(body?.utm_campaign),
    referrer: sanitize(body?.referrer),
    userAgent: sanitize(request.headers.get('user-agent')),
    ipAddress: ip,
    payload: body?.payload || {}
  };

  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: true, skipped: 'DATABASE_URL ausente' });
    }

    const sql = getDb();

    if (eventType === 'page_view') {
      await sql`
        INSERT INTO page_views (
          page_path, product_slug, session_id, utm_source, utm_medium, utm_campaign,
          referrer, user_agent, ip_address
        ) VALUES (
          ${event.pagePath || '/'}, ${event.productSlug || null}, ${event.sessionId || null},
          ${event.utmSource || null}, ${event.utmMedium || null}, ${event.utmCampaign || null},
          ${event.referrer || null}, ${event.userAgent || null}, ${event.ipAddress || null}
        )
      `;
    }

    await registerEventInDb(event);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('track event error', error);
    return NextResponse.json({ error: 'Falha ao registrar evento.' }, { status: 500 });
  }
}
