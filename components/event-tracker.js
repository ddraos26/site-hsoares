'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    const utm = getUtm();
    const resolvedPath = pagePath || pathname || '/';
    const resolvedProductSlug =
      productSlug || (resolvedPath.startsWith('/produtos/') ? resolvedPath.split('/')[2] || '' : '');

    if (resolvedPath.startsWith('/admin') || resolvedPath.startsWith('/login')) {
      return undefined;
    }

    function send(eventType) {
      fetch('/api/track/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          pagePath: resolvedPath,
          productSlug: resolvedProductSlug,
          sessionId,
          ...utm,
          referrer: document.referrer || ''
        })
      }).catch(() => null);
    }

    function heartbeat() {
      if (document.visibilityState !== 'visible') return;
      send('heartbeat');
    }

    send('page_view');
    heartbeat();

    const interval = window.setInterval(heartbeat, 45000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        heartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [pagePath, pathname, productSlug]);

  return null;
}
