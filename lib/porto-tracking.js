import {
  PORTO_PRODUCT_CATALOG,
  getPortoProductDefinitionByProductSlug,
  getPortoProductDefinitionFromHref,
  normalizePortoDestinationHref,
  portoDestinations
} from './porto-destinations';
import {
  getBrowserAttribution,
  getBrowserTrafficContext,
  getOrCreateBrowserSessionId,
  normalizePagePath
} from './tracking-attribution';

export const PORTO_DB_EVENT_TYPE = 'porto_click';
export const PORTO_TRACK_TIMEOUT_MS = 380;

export const PORTO_LINKS = Object.freeze(
  Object.fromEntries(
    Object.values(PORTO_PRODUCT_CATALOG).flatMap((definition) =>
      definition.urls.map((url) => [normalizePortoDestinationHref(url), definition.productSlug])
    )
  )
);

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

function inferTemplateType(pathname, explicitTemplateType = '') {
  const normalizedExplicit = normalizeKey(explicitTemplateType, 80);

  if (normalizedExplicit === 'product_page' || normalizedExplicit === 'blog_article' || normalizedExplicit === 'blog_category') {
    return normalizedExplicit;
  }

  if (normalizedExplicit.includes('product')) return 'product_page';
  if (normalizedExplicit.includes('blog') && normalizedExplicit.includes('article')) return 'blog_article';
  if (normalizedExplicit.includes('blog')) return 'blog_category';

  const normalizedPath = normalizePagePath(pathname);
  if (normalizedPath.startsWith('/blog/noticia/')) return 'blog_article';
  if (normalizedPath.startsWith('/blog/')) return 'blog_category';
  if (normalizedPath.startsWith('/produtos/')) return 'product_page';
  return 'site_page';
}

function inferArticleSlug(pathname, explicitArticleSlug = '') {
  const provided = sanitizeString(explicitArticleSlug, 160);
  if (provided) return provided;

  const normalizedPath = normalizePagePath(pathname);
  if (!normalizedPath.startsWith('/blog/noticia/')) {
    return '';
  }

  const slug = normalizedPath.split('/').filter(Boolean)[2] || '';
  return sanitizeString(slug, 160);
}

function inferCategorySlug(pathname, explicitCategorySlug = '', templateType = 'site_page') {
  const provided = sanitizeString(explicitCategorySlug, 160);
  if (provided) return provided;

  const normalizedPath = normalizePagePath(pathname);

  if (templateType === 'blog_category') {
    const slug = normalizedPath.split('/').filter(Boolean)[1] || '';
    return sanitizeString(slug, 160);
  }

  return '';
}

function inferSiteProductSlugFromPage(pathname, explicitProductSlug = '') {
  const provided = sanitizeString(explicitProductSlug, 160);
  if (provided) return provided;

  const normalizedPath = normalizePagePath(pathname);
  if (!normalizedPath.startsWith('/produtos/')) {
    return '';
  }

  const slug = normalizedPath.split('/').filter(Boolean)[1] || '';
  return sanitizeString(slug, 160);
}

function normalizeCtaPosition(value = '') {
  const key = normalizeKey(value, 120);

  if (!key) return 'inline_cta';
  if (key === 'hero_secondary' || key.includes('hero_support') || key.includes('hero_secondary')) return 'hero_secondary';
  if (key === 'hero_primary' || key === 'hero' || key.includes('hero')) return 'hero_primary';
  if (key === 'sticky_cta' || key.includes('sticky')) return 'sticky_cta';
  if (key === 'faq_cta' || key.includes('faq')) return 'faq_cta';
  if (key === 'footer_cta' || key.includes('final') || key.includes('closing') || key.includes('footer')) return 'footer_cta';
  if (key === 'comparison_cta' || key.includes('comparison') || key.includes('comparativo')) return 'comparison_cta';
  if (key === 'floating_cta' || key.includes('floating')) return 'floating_cta';
  if (key === 'inline_cta' || key.includes('inline') || key.includes('conversion_box')) return 'inline_cta';
  if (
    key === 'card_cta' ||
    key.startsWith('destination_') ||
    key.startsWith('plan_') ||
    key.includes('card')
  ) {
    return 'card_cta';
  }

  return 'section_middle';
}

function normalizePageSection(value = '', ctaPosition = '', templateType = 'site_page') {
  const key = normalizeKey(value, 120);

  if (key === 'hero' || key.includes('hero')) return 'hero';
  if (key === 'cobertura' || key.includes('coverage')) return 'cobertura';
  if (key === 'comparativo' || key.includes('comparison') || key.startsWith('destination_')) return 'comparativo';
  if (key === 'faq' || key.includes('faq')) return 'faq';
  if (key === 'final_cta' || key.includes('final') || key.includes('closing') || key.includes('conversion')) return 'final_cta';
  if (key === 'blog_content' || key.includes('blog')) return 'blog_content';
  if (key === 'floating_cta' || key.includes('sticky')) return 'hero';
  if (templateType === 'blog_article' || templateType === 'blog_category') return 'blog_content';

  if (ctaPosition === 'hero_primary' || ctaPosition === 'hero_secondary') return 'hero';
  if (ctaPosition === 'sticky_cta' || ctaPosition === 'floating_cta') return 'hero';
  if (ctaPosition === 'faq_cta') return 'faq';
  if (ctaPosition === 'comparison_cta' || ctaPosition === 'card_cta') return 'comparativo';
  if (ctaPosition === 'footer_cta') return 'final_cta';

  return 'section_middle';
}

function resolveCtaLabel({ ctaLabel = '', trackingPayload = {}, element = null } = {}) {
  const explicit =
    sanitizeString(ctaLabel, 160) ||
    sanitizeString(trackingPayload.cta_label, 160) ||
    sanitizeString(trackingPayload.ctaLabel, 160);

  if (explicit) {
    return explicit;
  }

  if (element && typeof element.textContent === 'string') {
    const text = sanitizeString(element.textContent, 160);
    if (text) return text;
  }

  return 'Clique Porto';
}

function resolveTemplateType(pathname, templateType = '', trackingPayload = {}) {
  return inferTemplateType(pathname, templateType || trackingPayload.template_type || trackingPayload.page_template);
}

function resolvePortoProduct({ href = '', productSlug = '', trackingPayload = {}, pagePath = '' } = {}) {
  const candidates = [
    productSlug,
    trackingPayload.product_slug,
    trackingPayload.productSlug,
    trackingPayload.site_product_slug,
    trackingPayload.siteProductSlug,
    inferSiteProductSlugFromPage(pagePath)
  ];

  for (const candidate of candidates) {
    const definition = getPortoProductDefinitionByProductSlug(candidate);
    if (definition) {
      return definition;
    }
  }

  return getPortoProductDefinitionFromHref(href);
}

function getPagePathFromOptions(pagePath = '') {
  if (sanitizeString(pagePath, 500)) {
    return normalizePagePath(pagePath);
  }

  if (typeof window !== 'undefined') {
    return normalizePagePath(window.location.pathname || '/');
  }

  return '/';
}

function getPageTitleFromOptions(pageTitle = '') {
  if (sanitizeString(pageTitle, 200)) {
    return sanitizeString(pageTitle, 200);
  }

  if (typeof document !== 'undefined') {
    return sanitizeString(document.title, 200);
  }

  return '';
}

export function normalizePortoHref(href) {
  return normalizePortoDestinationHref(href);
}

export function getPortoProductFromHref(href) {
  return getPortoProductDefinitionFromHref(href)?.productSlug || '';
}

export function getPortoTrackingProductBySlug(productSlug) {
  return getPortoProductDefinitionByProductSlug(productSlug)?.productSlug || '';
}

export function isPortoConversionLink(href) {
  return Boolean(getPortoProductDefinitionFromHref(href));
}

export function isTrackedPortoHref(href) {
  return isPortoConversionLink(href);
}

export function getPortoEventName(href) {
  return getPortoProductDefinitionFromHref(href)?.eventName || null;
}

export function buildPortoClickPayload(options = {}) {
  const trackingPayload = options.trackingPayload || {};
  const pagePath = getPagePathFromOptions(options.pagePath || trackingPayload.source_page_path);
  const product = resolvePortoProduct({
    href: options.href,
    productSlug: options.productSlug,
    trackingPayload,
    pagePath
  });

  if (!product) {
    return null;
  }

  const eventName = getPortoEventName(options.href);
  if (!eventName) {
    return null;
  }

  const ctaPosition = normalizeCtaPosition(
    options.ctaPosition ||
      trackingPayload.cta_position ||
      trackingPayload.ctaPosition ||
      trackingPayload.cta_placement ||
      trackingPayload.placement
  );
  const templateType = resolveTemplateType(pagePath, options.templateType, trackingPayload);
  const pageSection = normalizePageSection(
    options.pageSection || trackingPayload.page_section || trackingPayload.pageSection,
    ctaPosition,
    templateType
  );
  const articleSlug = inferArticleSlug(pagePath, options.articleSlug || trackingPayload.article_slug || trackingPayload.articleSlug);
  const categorySlug = inferCategorySlug(
    pagePath,
    options.categorySlug || trackingPayload.category_slug || trackingPayload.categorySlug,
    templateType
  );
  const siteProductSlug = product.siteProductSlugs[0] || '';
  const sourcePageProductSlug = inferSiteProductSlugFromPage(
    pagePath,
    options.sourceProductSlug || trackingPayload.source_page_product_slug || trackingPayload.sourceProductSlug
  );

  const payload = {
    product_slug: product.productSlug,
    product_name: product.productName,
    destination_url: normalizePortoHref(options.href),
    destination_domain: 'porto.vc',
    source_page_path: pagePath,
    source_page_title: getPageTitleFromOptions(options.pageTitle || trackingPayload.source_page_title),
    cta_label: resolveCtaLabel({
      ctaLabel: options.ctaLabel,
      trackingPayload,
      element: options.element
    }),
    cta_position: ctaPosition,
    link_type: 'porto_conversion',
    insurer: 'porto_seguro',
    outbound: true,
    page_section: pageSection,
    template_type: templateType,
    article_slug: articleSlug || undefined,
    category_slug: categorySlug || undefined,
    is_blog_page: templateType === 'blog_article' || templateType === 'blog_category',
    is_product_page: templateType === 'product_page',
    site_product_slug: siteProductSlug || undefined,
    source_page_product_slug: sourcePageProductSlug || undefined
  };

  return {
    payload,
    product,
    siteProductSlug,
    eventName
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
  if (typeof window === 'undefined') {
    return Promise.resolve('server');
  }

  if (!eventName) {
    return Promise.resolve('skipped');
  }

  return new Promise((resolve) => {
    let finished = false;

    const done = (dispatchMode) => {
      if (finished) {
        return;
      }

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

function getGa4DispatchMode() {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    return 'gtag';
  }

  return 'dataLayer';
}

function persistPortoClick({
  clickId,
  sessionId,
  siteProductSlug,
  payload,
  attribution,
  ga4DispatchMode,
  eventName,
  objective = 'porto_direct_click'
}) {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  const trafficContext = getBrowserTrafficContext({
    pagePath: payload.source_page_path,
    productSlug: siteProductSlug,
    objective
  });

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
        ...trafficContext,
        ...payload,
        ga4_event_name: eventName,
        ga4_dispatch_mode: ga4DispatchMode,
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
  const sessionId = sanitizeString(options.sessionId, 120) || getOrCreateBrowserSessionId();
  const attribution = options.attribution || getBrowserAttribution();
  const browserPayload = {
    ...resolved.payload,
    click_id: clickId || undefined,
    session_id: sessionId || undefined
  };

  logPortoTracking('log', resolved.eventName, browserPayload);

  const ga4DispatchMode = getGa4DispatchMode();
  const browserTask = dispatchPortoGaEvent(resolved.eventName, browserPayload);
  const persistedTask = persistPortoClick({
    clickId,
    sessionId,
    siteProductSlug: resolved.siteProductSlug,
    payload: browserPayload,
    attribution,
    ga4DispatchMode,
    eventName: resolved.eventName,
    objective: sanitizeString(options.objective, 120) || 'porto_direct_click'
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
