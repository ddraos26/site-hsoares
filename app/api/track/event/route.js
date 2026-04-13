import { NextResponse } from 'next/server';
import { registerEventInDb } from '@/lib/analytics';
import { getDb } from '@/lib/db';
import { getClientIp, hasJsonContentType, isAllowedOrigin } from '@/lib/request';
import { rateLimit } from '@/lib/rate-limit';
import { normalizeTrackingRecord } from '@/lib/tracking-attribution';

export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = new Set([
  'page_view',
  'porto_click',
  'lead_submit',
  'heartbeat',
  'whatsapp_click',
  'phone_click',
  'email_click',
  'cta_primary_click',
  'cta_secondary_click',
  'important_link_click',
  'scroll_relevant',
  'thank_you_view'
]);

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

  const tracking = normalizeTrackingRecord({
    pagePath: body?.pagePath,
    productSlug: body?.productSlug,
    clickId: body?.clickId,
    sessionId: body?.sessionId,
    utm_source: body?.utm_source,
    utm_medium: body?.utm_medium,
    utm_campaign: body?.utm_campaign,
    referrer: body?.referrer,
    payload: body?.payload || {}
  });

  const event = {
    eventType,
    pagePath: tracking.pagePath,
    productSlug: tracking.productSlug,
    clickId: tracking.clickId,
    sessionId: tracking.sessionId,
    utmSource: tracking.utmSource,
    utmMedium: tracking.utmMedium,
    utmCampaign: tracking.utmCampaign,
    referrer: tracking.referrer,
    userAgent: sanitize(request.headers.get('user-agent')),
    ipAddress: ip,
    payload: tracking.payload,
    debugMode: body?.debug_mode === true || body?.debug_mode === 'true'
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
