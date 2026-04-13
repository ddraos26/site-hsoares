import { normalizeTrackingRecord } from '@/lib/tracking-attribution';

async function sendGa4Measurement(eventName, params) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    return;
  }

  const clientId = params.client_id || params.session_id || `${Date.now()}.hsoares`;

  const debugQuery = params?.debug_mode ? '&debug_mode=true' : '';
  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}${debugQuery}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: String(clientId),
        events: [
          {
            name: eventName,
            params: {
              ...params,
              debug_mode: process.env.GA4_DEBUG_MODE === 'true' || params?.debug_mode === true
            }
          }
        ]
      })
    }
  );
}

function shouldSendGa4Measurement(event) {
  if (event?.eventType === 'porto_click') {
    return false;
  }

  return true;
}

export async function registerEventInDb(rawEvent) {
  const { getDb } = await import('./db.js');
  const sql = getDb();
  const tracking = normalizeTrackingRecord(rawEvent);
  const event = {
    ...rawEvent,
    ...tracking
  };
  const payload = event.payload && typeof event.payload === 'object' ? event.payload : {};

  await sql`
    INSERT INTO conversion_events (
      event_type, page_path, product_slug, click_id, session_id,
      utm_source, utm_medium, utm_campaign, referrer, user_agent, ip_address,
      payload
    ) VALUES (
      ${event.eventType}, ${event.pagePath || null}, ${event.productSlug || null}, ${event.clickId || null}, ${event.sessionId || null},
      ${event.utmSource || null}, ${event.utmMedium || null}, ${event.utmCampaign || null}, ${event.referrer || null}, ${event.userAgent || null}, ${event.ipAddress || null},
      ${JSON.stringify(event.payload || {})}::jsonb
    )
  `;

  if (shouldSendGa4Measurement(event)) {
    await sendGa4Measurement(event.eventType, {
      page_path: event.pagePath || undefined,
      product_slug: event.productSlug || undefined,
      click_id: event.clickId || undefined,
      session_id: event.sessionId || undefined,
      utm_source: event.utmSource || undefined,
      utm_medium: event.utmMedium || undefined,
      utm_campaign: event.utmCampaign || undefined,
      traffic_bucket: typeof payload.traffic_bucket === 'string' ? payload.traffic_bucket : undefined,
      page_role: typeof payload.page_role === 'string' ? payload.page_role : undefined,
      cta_placement: typeof payload.cta_placement === 'string' ? payload.cta_placement : undefined,
      has_paid_click_marker: payload.has_paid_click_marker === true ? 1 : undefined,
      event_origin: 'server',
      debug_mode: event.debugMode
    });
  }
}
