'use client';

import { usePathname } from 'next/navigation';
import { isPortoConversionLink, trackPortoClick } from '@/lib/porto-tracking';

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function TrackedPortoLink({
  href,
  children,
  onClick,
  target,
  productSlug = '',
  ctaLabel = '',
  ctaPosition = '',
  pageSection = '',
  templateType = '',
  articleSlug = '',
  categorySlug = '',
  trackingPayload = {},
  ...props
}) {
  const pathname = usePathname();

  async function handleClick(event) {
    if (!isPortoConversionLink(href)) {
      onClick?.(event);
      return;
    }

    const currentTarget = event.currentTarget;
    const effectiveTarget = target || currentTarget.getAttribute('target') || '';
    const shouldWaitForTracking =
      isPlainLeftClick(event) && (!effectiveTarget || effectiveTarget === '_self') && !currentTarget.hasAttribute('download');
    const trackingOptions = {
      href: currentTarget.href || href,
      productSlug,
      ctaLabel,
      ctaPosition,
      pageSection,
      templateType,
      articleSlug,
      categorySlug,
      trackingPayload,
      pagePath: pathname || '',
      pageTitle: typeof document !== 'undefined' ? document.title : '',
      element: currentTarget,
      waitForTracking: shouldWaitForTracking
    };
    const originalPreventDefault = event.preventDefault?.bind(event);
    let userPreventedDefault = false;

    if (originalPreventDefault) {
      event.preventDefault = () => {
        userPreventedDefault = true;
        originalPreventDefault();
      };
    }

    if (!shouldWaitForTracking) {
      void trackPortoClick(trackingOptions);
      try {
        onClick?.(event);
      } finally {
        if (originalPreventDefault) {
          event.preventDefault = originalPreventDefault;
        }
      }

      return;
    }

    originalPreventDefault?.();
    await trackPortoClick(trackingOptions);
    try {
      onClick?.(event);
    } finally {
      if (originalPreventDefault) {
        event.preventDefault = originalPreventDefault;
      }
    }

    if (!userPreventedDefault) {
      window.location.assign(currentTarget.href || href);
    }
  }

  return (
    <a {...props} href={href} target={target} onClick={handleClick}>
      {children}
    </a>
  );
}

export default TrackedPortoLink;
