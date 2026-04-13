const SESSION_STORAGE_KEY = 'hs_session_id';
const FIRST_TOUCH_STORAGE_KEY = 'hs_first_touch_attribution';
const LAST_TOUCH_STORAGE_KEY = 'hs_last_touch_attribution';

const EMPTY_ATTRIBUTION = Object.freeze({
  utm_source: '',
  utm_medium: '',
  utm_campaign: ''
});

const CLICK_MARKER_SOURCE_MAP = Object.freeze({
  gclid: 'google',
  gbraid: 'google',
  wbraid: 'google',
  fbclid: 'meta',
  msclkid: 'microsoft'
});

const EMPTY_TRACKING_MARKERS = new Set([
  '',
  '(not set)',
  '(none)',
  'not set',
  'none',
  'undefined',
  'null',
  'n/a',
  'na',
  '-',
  '""',
  "''"
]);

function sanitizeString(value, limit = 160) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function isEmptyTrackingValue(value) {
  return EMPTY_TRACKING_MARKERS.has(String(value || '').trim().toLowerCase());
}

function normalizeSource(value) {
  const normalized = sanitizeString(value, 120).toLowerCase();
  if (isEmptyTrackingValue(normalized)) return '';
  if (normalized.includes('facebook') || normalized.includes('instagram') || normalized === 'meta') return 'meta';
  if (normalized.includes('google')) return 'google';
  if (normalized.includes('linkedin')) return 'linkedin';
  if (normalized.includes('whatsapp')) return 'whatsapp';
  if (normalized.includes('email')) return 'email';
  return normalized;
}

function normalizeMedium(value) {
  const normalized = sanitizeString(value, 120)
    .toLowerCase()
    .replace(/[_\s]+/g, '-');

  if (isEmptyTrackingValue(normalized)) return '';
  if (['cpc', 'ppc', 'paid', 'paid-search', 'paidsearch', 'search-paid'].includes(normalized)) return 'paid-search';
  if (['paid-social', 'paidsocial', 'social-paid', 'social'].includes(normalized)) return 'paid-social';
  if (['organic-search', 'organicsearch', 'seo'].includes(normalized)) return 'organic-search';
  if (['organic-social', 'social-organic'].includes(normalized)) return 'organic-social';
  if (['email-marketing', 'mail'].includes(normalized)) return 'email';
  return normalized;
}

function normalizeCampaign(value) {
  const normalized = sanitizeString(value, 160);
  if (isEmptyTrackingValue(normalized)) return '';
  return normalized.toLowerCase();
}

function readClickMarkersFromUrl(url) {
  try {
    const parsed = typeof url === 'string' ? new URL(url) : new URL(window.location.href);
    return Object.keys(CLICK_MARKER_SOURCE_MAP).reduce((acc, key) => {
      const value = sanitizeString(parsed.searchParams.get(key), 180);
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function inferAttributionFromClickMarkers(markers = {}) {
  const markerKey = Object.keys(markers).find((key) => Boolean(markers[key]));
  const source = markerKey ? CLICK_MARKER_SOURCE_MAP[markerKey] || '' : '';

  if (!source) {
    return { utm_source: '', utm_medium: '' };
  }

  if (source === 'meta') {
    return {
      utm_source: source,
      utm_medium: 'paid-social'
    };
  }

  return {
    utm_source: source,
    utm_medium: 'paid-search'
  };
}

export function normalizePagePath(value) {
  const raw = sanitizeString(value, 500);
  if (!raw) return '/';

  let pathname = raw;

  try {
    if (/^https?:\/\//i.test(raw)) {
      pathname = new URL(raw).pathname || '/';
    }
  } catch {
    pathname = raw;
  }

  pathname = pathname.split('?')[0].split('#')[0].trim();

  if (!pathname) return '/';
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
  return pathname || '/';
}

function normalizeReferrer(value) {
  const raw = sanitizeString(value, 600);
  if (!raw || isEmptyTrackingValue(raw)) return '';

  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return raw;
  }
}

function normalizePrimitivePayloadValue(value) {
  if (typeof value === 'string') {
    return sanitizeString(value, 500);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return null;
}

export function normalizeTrackingPayload(value, depth = 0) {
  if (value == null) return {};
  if (depth > 3) return null;

  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item) => normalizeTrackingPayload(item, depth + 1))
      .filter((item) => item !== null && item !== '');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).slice(0, 20);
    return entries.reduce((acc, [key, item]) => {
      const normalizedKey = sanitizeString(key, 80);
      if (!normalizedKey) return acc;
      const normalizedValue = normalizeTrackingPayload(item, depth + 1);
      if (normalizedValue === null || normalizedValue === '') return acc;
      acc[normalizedKey] = normalizedValue;
      return acc;
    }, {});
  }

  return normalizePrimitivePayloadValue(value);
}

export function normalizeTrackingRecord(input = {}) {
  return {
    pagePath: normalizePagePath(input.pagePath),
    productSlug: sanitizeString(input.productSlug, 160).toLowerCase(),
    clickId: sanitizeString(input.clickId, 120),
    sessionId: sanitizeString(input.sessionId, 120),
    utmSource: normalizeSource(input.utmSource ?? input.utm_source),
    utmMedium: normalizeMedium(input.utmMedium ?? input.utm_medium),
    utmCampaign: normalizeCampaign(input.utmCampaign ?? input.utm_campaign),
    referrer: normalizeReferrer(input.referrer),
    payload: normalizeTrackingPayload(input.payload)
  };
}

function hasAttribution(attribution) {
  return Boolean(attribution?.utm_source || attribution?.utm_medium || attribution?.utm_campaign);
}

function readAttributionFromUrl(url) {
  try {
    const parsed = typeof url === 'string' ? new URL(url) : new URL(window.location.href);
    const clickMarkers = readClickMarkersFromUrl(parsed);
    const inferred = inferAttributionFromClickMarkers(clickMarkers);
    return {
      utm_source: normalizeSource(parsed.searchParams.get('utm_source')) || inferred.utm_source,
      utm_medium: normalizeMedium(parsed.searchParams.get('utm_medium')) || inferred.utm_medium,
      utm_campaign: normalizeCampaign(parsed.searchParams.get('utm_campaign'))
    };
  } catch {
    return { ...EMPTY_ATTRIBUTION };
  }
}

function mergeAttribution(...items) {
  return items.reduce(
    (acc, item) => ({
      utm_source: acc.utm_source || item?.utm_source || '',
      utm_medium: acc.utm_medium || item?.utm_medium || '',
      utm_campaign: acc.utm_campaign || item?.utm_campaign || ''
    }),
    { ...EMPTY_ATTRIBUTION }
  );
}

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readStorageJson(key) {
  if (!canUseBrowserStorage()) return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      utm_source: normalizeSource(parsed?.utm_source),
      utm_medium: normalizeMedium(parsed?.utm_medium),
      utm_campaign: normalizeCampaign(parsed?.utm_campaign)
    };
  } catch {
    return null;
  }
}

function writeStorageJson(key, value) {
  if (!canUseBrowserStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures and keep the site functional.
  }
}

export function getOrCreateBrowserSessionId() {
  if (!canUseBrowserStorage()) return '';

  const current = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (current) return current;

  const next = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  window.localStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

export function getBrowserAttribution(url = null) {
  if (!canUseBrowserStorage()) return { ...EMPTY_ATTRIBUTION };

  const current = readAttributionFromUrl(url || window.location.href);
  const firstTouch = readStorageJson(FIRST_TOUCH_STORAGE_KEY);
  const lastTouch = readStorageJson(LAST_TOUCH_STORAGE_KEY);

  if (hasAttribution(current)) {
    writeStorageJson(LAST_TOUCH_STORAGE_KEY, current);
    if (!hasAttribution(firstTouch)) {
      writeStorageJson(FIRST_TOUCH_STORAGE_KEY, current);
    }
  }

  return mergeAttribution(current, lastTouch, firstTouch);
}

function normalizeTrafficBucket(value) {
  return sanitizeString(value, 80).toLowerCase().replace(/\s+/g, '-');
}

function inferReferrerBucket(referrer = '') {
  const raw = sanitizeString(referrer, 600).toLowerCase();
  if (!raw) return 'direct';

  if (
    raw.includes('google.') ||
    raw.includes('bing.') ||
    raw.includes('yahoo.') ||
    raw.includes('duckduckgo.') ||
    raw.includes('search.brave.')
  ) {
    return 'organic-search';
  }

  if (
    raw.includes('facebook.') ||
    raw.includes('instagram.') ||
    raw.includes('linkedin.') ||
    raw.includes('tiktok.')
  ) {
    return 'social-referral';
  }

  return 'referral';
}

function inferPageRole(pagePath = '') {
  const normalized = normalizePagePath(pagePath);
  if (normalized.startsWith('/produtos/')) return 'product-landing';
  if (normalized.startsWith('/blog/noticia/')) return 'blog-article';
  if (normalized.startsWith('/blog/')) return 'blog-category';
  return 'site-page';
}

export function getBrowserTrafficContext({ pagePath = '', productSlug = '', objective = '' } = {}) {
  if (typeof window === 'undefined') {
    return {
      page_role: inferPageRole(pagePath),
      traffic_bucket: 'unknown',
      source_hint: '',
      medium_hint: '',
      paid_click_marker: '',
      has_paid_click_marker: false,
      has_campaign_params: false,
      objective: sanitizeString(objective, 120),
      product_slug: sanitizeString(productSlug, 160).toLowerCase()
    };
  }

  const url = new URL(window.location.href);
  const attribution = getBrowserAttribution(url);
  const clickMarkers = readClickMarkersFromUrl(url);
  const paidClickMarker = Object.keys(clickMarkers).find((key) => Boolean(clickMarkers[key])) || '';
  const referrer = document.referrer || '';

  let trafficBucket = 'direct';
  if (attribution.utm_medium) {
    trafficBucket = attribution.utm_medium;
  } else if (paidClickMarker) {
    trafficBucket = inferAttributionFromClickMarkers(clickMarkers).utm_medium || 'paid';
  } else {
    trafficBucket = inferReferrerBucket(referrer);
  }

  return {
    page_role: inferPageRole(pagePath || window.location.pathname || '/'),
    traffic_bucket: normalizeTrafficBucket(trafficBucket),
    source_hint: attribution.utm_source || '',
    medium_hint: attribution.utm_medium || '',
    paid_click_marker: paidClickMarker,
    has_paid_click_marker: Boolean(paidClickMarker),
    has_campaign_params: Boolean(attribution.utm_campaign || attribution.utm_source || attribution.utm_medium || paidClickMarker),
    objective: sanitizeString(objective, 120),
    product_slug: sanitizeString(productSlug, 160).toLowerCase()
  };
}
