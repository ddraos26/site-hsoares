import {
  PORTO_PRODUCT_CATALOG,
  getPortoProductDefinitionByProductSlug,
  getPortoProductDefinitionFromHref,
  normalizePortoDestinationHref,
  portoDestinations
} from './porto-destinations';

export const PORTO_DB_EVENT_TYPE = 'porto_click';
export const PORTO_TRACK_TIMEOUT_MS = 380;

export const PORTO_EVENT_MAP = Object.freeze(
  Object.fromEntries(
    Object.values(PORTO_PRODUCT_CATALOG).flatMap((definition) =>
      definition.urls.map((url) => [normalizePortoDestinationHref(url), definition.eventName])
    )
  )
);

function sanitizeString(value, limit = 300) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function normalizeKey(value, limit = 120) {
  return sanitizeString(value, limit)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function logPortoTracking(level, ...args) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const logger = level === 'error' ? console.error : console.log;
  logger('[Porto GA4]', ...args);
}

function buildClickId(seed = 'porto') {
  const safeSeed = normalizeKey(seed, 80) || 'porto';
  return `${safeSeed}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getOrCreateSessionId() {
  if (typeof window === 'undefined') {
    return '';
  }

  const key = 'hs_session_id';
  const current = window.localStorage.getItem(key);
  if (current) return current;

  const newValue = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  window.localStorage.setItem(key, newValue);
  return newValue;
}

function getAttribution() {
  if (typeof window === 'undefined') {
    return {};
  }

  const url = new URL(window.location.href);
  return {
    utm_source: url.searchParams.get('utm_source') || '',
    utm_medium: url.searchParams.get('utm_medium') || '',
    utm_campaign: url.searchParams.get('utm_campaign') || ''
  };
}

export function normalizePortoHref(href) {
  return normalizePortoDestinationHref(href);
}

export function getPortoEventName(href) {
  return getPortoProductDefinitionFromHref(href)?.eventName || null;
}

export function isPortoConversionLink(href) {
  return Boolean(getPortoProductDefinitionFromHref(href));
}

export function buildPortoClickPayload(options = {}) {
  const product =
    getPortoProductDefinitionByProductSlug(options.productSlug) ||
    getPortoProductDefinitionFromHref(options.href);
  const eventName = getPortoEventName(options.href);

  if (!product || !eventName) {
    return null;
  }

  const pagePath =
    sanitizeString(options.pagePath, 500) ||
    (typeof window !== 'undefined' ? window.location.pathname || '/' : '/');

  return {
    eventName,
    product,
    siteProductSlug: product.siteProductSlugs[0] || '',
    payload: {
      product_slug: product.productSlug,
      product_name: product.productName,
      destination_url: normalizePortoHref(options.href),
      destination_domain: 'porto.vc',
      source_page_path: pagePath,
      source_page_title: sanitizeString(options.pageTitle, 200) || (typeof document !== 'undefined' ? document.title : ''),
      cta_label: sanitizeString(options.ctaLabel, 160) || 'Clique Porto',
      cta_position: sanitizeString(options.ctaPosition, 120) || 'inline_cta',
      page_section: sanitizeString(options.pageSection, 120) || 'section_middle',
      template_type: sanitizeString(options.templateType, 120) || 'site_page',
      link_type: 'porto_conversion',
      insurer: 'porto_seguro',
      outbound: true,
      ...(options.trackingPayload || {})
    }
  };
}

function waitForTracking(tasks = [], timeoutMs = PORTO_TRACK_TIMEOUT_MS) {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  return Promise.race([
    Promise.allSettled(tasks),
    new Promise((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    })
  ]);
}

function dispatchPortoGaEvent(eventName, payload) {
  if (typeof window === 'undefined' || !eventName) {
    return Promise.resolve('skipped');
  }

  return new Promise((resolve) => {
    let finished = false;
    const done = (dispatchMode) => {
      if (finished) return;
      finished = true;
      resolve(dispatchMode);
    };

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, {
          ...payload,
          transport_type: 'beacon',
          event_callback: () => done('gtag')
        });
        window.setTimeout(() => done('gtag'), PORTO_TRACK_TIMEOUT_MS);
        return;
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        ...payload
      });
      done('dataLayer');
    } catch (error) {
      logPortoTracking('error', 'Erro ao enviar evento Porto para o browser:', error);
      done('error');
    }
  });
}

function persistPortoClick({ clickId, sessionId, siteProductSlug, payload, attribution, eventName }) {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  return fetch('/api/track/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      eventType: PORTO_DB_EVENT_TYPE,
      pagePath: payload.source_page_path,
      productSlug: siteProductSlug,
      clickId,
      sessionId,
      ...attribution,
      referrer: document.referrer || '',
      payload: {
        ...payload,
        ga4_event_name: eventName,
        destination_host: 'porto.vc'
      }
    })
  })
    .then(() => true)
    .catch((error) => {
      logPortoTracking('error', 'Erro ao registrar clique Porto no backend:', error);
      return false;
    });
}

export async function trackPortoClick(input = {}, extra = {}) {
  const baseOptions = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const options =
    typeof input === 'string'
      ? { href: input, trackingPayload: extra }
      : {
          ...baseOptions,
          trackingPayload: {
            ...(baseOptions.trackingPayload || {}),
            ...(extra || {})
          }
        };

  if (typeof window === 'undefined') {
    return { tracked: false, clickId: sanitizeString(options.clickId, 120), sessionId: sanitizeString(options.sessionId, 120) };
  }

  const resolved = buildPortoClickPayload(options);
  if (!resolved) {
    return { tracked: false, clickId: sanitizeString(options.clickId, 120), sessionId: sanitizeString(options.sessionId, 120) };
  }

  const clickId = sanitizeString(options.clickId, 120) || buildClickId(resolved.siteProductSlug || resolved.product.productSlug);
  const sessionId = sanitizeString(options.sessionId, 120) || getOrCreateSessionId();
  const attribution = options.attribution || getAttribution();
  const browserPayload = {
    ...resolved.payload,
    click_id: clickId || undefined,
    session_id: sessionId || undefined
  };

  logPortoTracking('log', resolved.eventName, browserPayload);

  const browserTask = dispatchPortoGaEvent(resolved.eventName, browserPayload);
  const persistedTask = persistPortoClick({
    clickId,
    sessionId,
    siteProductSlug: resolved.siteProductSlug,
    payload: browserPayload,
    attribution,
    eventName: resolved.eventName
  });

  if (options.waitForTracking !== false) {
    await waitForTracking([browserTask, persistedTask], options.timeoutMs || PORTO_TRACK_TIMEOUT_MS);
  }

  return {
    tracked: true,
    clickId,
    sessionId,
    payload: browserPayload,
    siteProductSlug: resolved.siteProductSlug,
    productSlug: resolved.payload.product_slug,
    eventName: resolved.eventName
  };
}

export { portoDestinations };
