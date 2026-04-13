async function sendGa4Measurement(eventName, params) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    return;
  }

  const clientId = params.client_id || params.session_id || `${Date.now()}.hsoares`;

  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: String(clientId),
        events: [{ name: eventName, params }]
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

export async function registerEventInDb(event) {
  const { getDb } = await import('./db.js');
  const sql = getDb();

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
      event_origin: 'server'
    });
  }
}
