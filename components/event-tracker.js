'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getBrowserAttribution, getBrowserTrafficContext, getOrCreateBrowserSessionId } from '@/lib/tracking-attribution';

export function EventTracker({ pagePath, productSlug = '' }) {
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = getOrCreateBrowserSessionId();
    const utm = getBrowserAttribution();
    const resolvedPath = pagePath || pathname || '/';
    const resolvedProductSlug =
      productSlug || (resolvedPath.startsWith('/produtos/') ? resolvedPath.split('/')[2] || '' : '');

    if (resolvedPath.startsWith('/admin') || resolvedPath.startsWith('/login')) {
      return undefined;
    }

    const debugMode = typeof window !== 'undefined' && window.location.search.includes('gtm_debug');
    const trafficContext = getBrowserTrafficContext({
      pagePath: resolvedPath,
      productSlug: resolvedProductSlug,
      objective: resolvedPath.startsWith('/produtos/') ? 'porto_direct_click_candidate' : ''
    });

    function send(eventType) {
      fetch('/api/track/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          pagePath: resolvedPath,
          productSlug: resolvedProductSlug,
          sessionId,
          debug_mode: debugMode,
          ...utm,
          referrer: document.referrer || '',
          payload: {
            ...trafficContext,
            event_surface: eventType === 'page_view' ? 'landing-entry' : 'heartbeat'
          }
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
