'use client';

import { usePathname } from 'next/navigation';
import { TrackedPortoLink } from '@/components/tracked-porto-link';
import { isPortoConversionLink } from '@/lib/porto-tracking';
import { getBrowserAttribution, getBrowserTrafficContext, getOrCreateBrowserSessionId } from '@/lib/tracking-attribution';

export function TrackedExternalLink({
  href,
  eventType = 'important_link_click',
  productSlug = '',
  objective = '',
  payload = {},
  ctaLabel = '',
  ctaPosition = '',
  pageSection = '',
  templateType = '',
  articleSlug = '',
  categorySlug = '',
  children,
  onClick,
  ...props
}) {
  const pathname = usePathname();

  function handleClick(event) {
    onClick?.(event);

    if (event.defaultPrevented || isPortoConversionLink(href)) {
      return;
    }

    if (typeof window === 'undefined') return;

    const sessionId = getOrCreateBrowserSessionId();
    const utm = getBrowserAttribution();
    const trafficContext = getBrowserTrafficContext({
      pagePath: pathname || '/',
      productSlug,
      objective
    });
    let destinationHost = '';

    try {
      destinationHost = new URL(href, window.location.origin).host || '';
    } catch {
      destinationHost = '';
    }

    fetch('/api/track/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        eventType,
        pagePath: pathname || '/',
        productSlug,
        sessionId,
        referrer: document.referrer || '',
        payload: {
          ...trafficContext,
          href,
          destination_host: destinationHost,
          ...payload
        },
        ...utm
      })
    }).catch(() => null);
  }

  if (isPortoConversionLink(href)) {
    return (
      <TrackedPortoLink
        {...props}
        href={href}
        onClick={handleClick}
        productSlug={productSlug}
        ctaLabel={ctaLabel}
        ctaPosition={ctaPosition}
        pageSection={pageSection}
        templateType={templateType}
        articleSlug={articleSlug}
        categorySlug={categorySlug}
        trackingPayload={payload}
      >
        {children}
      </TrackedPortoLink>
    );
  }

  return (
    <a {...props} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
