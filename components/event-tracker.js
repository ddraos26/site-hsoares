'use client';

import { useEffect } from 'react';

function getOrCreateSessionId() {
  const key = 'hs_session_id';
  const current = window.localStorage.getItem(key);
  if (current) return current;

  const newValue = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  window.localStorage.setItem(key, newValue);
  return newValue;
}

function getUtm() {
  const url = new URL(window.location.href);
  return {
    utm_source: url.searchParams.get('utm_source') || '',
    utm_medium: url.searchParams.get('utm_medium') || '',
    utm_campaign: url.searchParams.get('utm_campaign') || ''
  };
}

export function EventTracker({ pagePath, productSlug = '' }) {
  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    const utm = getUtm();

    fetch('/api/track/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'page_view',
        pagePath,
        productSlug,
        sessionId,
        ...utm,
        referrer: document.referrer || ''
      })
    }).catch(() => null);
  }, [pagePath, productSlug]);

  return null;
}
