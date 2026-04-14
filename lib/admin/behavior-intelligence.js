import 'server-only';

import { google } from 'googleapis';
import { getDb } from '@/lib/db';
import { getGoogleAuthClient } from '@/lib/google/client';
import { products as catalogProducts } from '@/lib/products';

const PRODUCT_NAME_MAP = new Map(catalogProducts.map((product) => [product.slug, product.name]));
const CORE_PRODUCT_ORDER = [
  'cartao-credito-porto-bank',
  'seguro-celular',
  'seguro-viagem',
  'seguro-vida-on'
];

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPercent(value, total) {
  if (!total) return 0;
  return Number(((value / total) * 100).toFixed(1));
}

function formatEventLabel(eventType) {
  return (
    {
      page_view: 'Page view',
      heartbeat: 'Heartbeat',
      porto_click: 'Clique Porto',
      whatsapp_click: 'Clique WhatsApp',
      phone_click: 'Clique telefone',
      email_click: 'Clique e-mail',
      cta_primary_click: 'CTA principal',
      cta_secondary_click: 'CTA secundário',
      important_link_click: 'Link importante',
      lead_submit: 'Envio de lead',
      scroll_relevant: 'Scroll relevante',
      thank_you_view: 'Página de obrigado'
    }[eventType] || eventType
  );
}

function normalizeProductLabel(slug) {
  if (!slug) return 'Sem produto';
  return PRODUCT_NAME_MAP.get(slug) || slug;
}

function mapChannelLabel(channel) {
  return (
    {
      paid: 'Pago',
      organic: 'Orgânico',
      referral: 'Referência',
      direct: 'Direto'
    }[channel] || 'Outro'
  );
}

function buildRecommendations(snapshot) {
  const items = [];
  const mobile = snapshot.devices.find((item) => item.device === 'Mobile');
  const desktop = snapshot.devices.find((item) => item.device === 'Desktop');
  const topExit = snapshot.exitPages[0];
  const whatsappClicks = snapshot.summary.whatsappClicks;
  const leads = snapshot.summary.leads;
  const thankYouViews = snapshot.summary.thankYouViews;

  if (whatsappClicks >= Math.max(6, leads * 2)) {
    items.push({
      title: 'Existe intenção comercial antes da conversão final',
      description: 'Os cliques em WhatsApp estão acima da captura efetiva de leads.',
      effect: 'Vale revisar abordagem, tempo de resposta e reforço de prova social após o clique.',
      tone: 'warning'
    });
  }

  if (topExit?.pagePath?.startsWith('/produtos/')) {
    items.push({
      title: 'Uma landing de produto está perdendo a atenção no meio da jornada',
      description: `${topExit.pagePath} aparece como uma das principais saídas do período.`,
      effect: 'Revisar hero, CTA acima da dobra e prova de valor pode recuperar visitas já conquistadas.',
      tone: 'danger'
    });
  }

  if (mobile && mobile.share >= 60 && (!desktop || mobile.pageViews > desktop.pageViews)) {
    items.push({
      title: 'A experiência mobile virou prioridade operacional',
      description: `${mobile.share}% das visualizações aconteceram no mobile.`,
      effect: 'Botões, formulários, blocos de copy e sticky CTA precisam ser validados primeiro no celular.',
      tone: 'premium'
    });
  }

  if (thankYouViews === 0 && leads > 0) {
    items.push({
      title: 'Agradecimento e pós-conversão ainda não estão instrumentados',
      description: 'O sistema captou leads, mas não registrou página de obrigado no período.',
      effect: 'Corrigir esse evento melhora leitura de funil e decisões de escala.',
      tone: 'warning'
    });
  }

  if (!items.length) {
    items.push({
      title: 'A base comportamental está saudável para leitura rápida',
      description: 'Os sinais atuais ajudam a identificar comportamento, canais e páginas de entrada/saída.',
      effect: 'O próximo salto é aprofundar custo, funil e ações automáticas por regra.',
      tone: 'success'
    });
  }

  return items.slice(0, 3);
}

async function getGa4Snapshot(days) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GA4_PROPERTY_ID) {
    return {
      status: 'pending',
      statusLabel: 'GA4 não conectado',
      summary: null,
      topPages: [],
      reason: 'Configure GOOGLE_SERVICE_ACCOUNT_KEY e GA4_PROPERTY_ID para enriquecer o módulo com métricas nativas do GA4.'
    };
  }

  try {
    const auth = await getGoogleAuthClient();
    const analytics = google.analyticsdata({ version: 'v1beta', auth });
    const property = `properties/${process.env.GA4_PROPERTY_ID}`;

    const [summaryResponse, topPagesResponse] = await Promise.all([
      analytics.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' }
          ]
        }
      }),
      analytics.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'activeUsers' }, { name: 'averageSessionDuration' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 6
        }
      })
    ]);

    const summaryValues = summaryResponse.data.rows?.[0]?.metricValues || [];
    const topPages = (topPagesResponse.data.rows || []).map((row) => ({
      pagePath: row.dimensionValues?.[0]?.value || '/',
      activeUsers: toNumber(row.metricValues?.[0]?.value),
      avgSessionDuration: Math.round(toNumber(row.metricValues?.[1]?.value))
    }));

    return {
      status: 'connected',
      statusLabel: 'GA4 ativo',
      summary: {
        activeUsers: toNumber(summaryValues[0]?.value),
        sessions: toNumber(summaryValues[1]?.value),
        pageViews: toNumber(summaryValues[2]?.value),
        avgSessionDuration: Math.round(toNumber(summaryValues[3]?.value))
      },
      topPages,
      reason: 'Leitura nativa do GA4 disponível para complementar o tracking próprio.'
    };
  } catch (error) {
    return {
      status: 'partial',
      statusLabel: 'GA4 com acesso parcial',
      summary: null,
      topPages: [],
      reason: error instanceof Error ? error.message : 'Falha ao consultar o GA4.'
    };
  }
}

function emptySnapshot(days, reason, ga4) {
  return {
    status: 'partial',
    statusLabel: 'Base comportamental indisponível',
    reason,
    windowDays: days,
    summary: {
      sessions: 0,
      pageViews: 0,
      leads: 0,
      whatsappClicks: 0,
      primaryCtas: 0,
      secondaryCtas: 0,
      importantLinks: 0,
      scrollRelevant: 0,
      thankYouViews: 0,
      avgPagesPerSession: 0
    },
    channels: [],
    devices: [],
    topEvents: [],
    entryPages: [],
    exitPages: [],
    topFlows: [],
    productJourneys: [],
    recommendations: [],
    ga4
  };
}

export async function getBehaviorIntelligenceSnapshot({ days = 30 } = {}) {
  const ga4 = await getGa4Snapshot(days);

  let sql;
  try {
    sql = getDb();
  } catch (error) {
    return emptySnapshot(days, error instanceof Error ? error.message : 'Banco não configurado.', ga4);
  }

  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const toDate = new Date();
  const from = fromDate.toISOString();
  const to = toDate.toISOString();

  try {
    const [
      summaryRows,
      channelsRows,
      devicesRows,
      topEventsRows,
      entryPagesRows,
      exitPagesRows,
      flowRows,
      productRows
    ] = await Promise.all([
      sql`
        WITH sessions AS (
          SELECT COUNT(DISTINCT session_id)::int AS total
          FROM page_views
          WHERE created_at BETWEEN ${from} AND ${to}
            AND session_id IS NOT NULL
        ),
        page_base AS (
          SELECT COUNT(*)::int AS total
          FROM page_views
          WHERE created_at BETWEEN ${from} AND ${to}
        ),
        event_base AS (
          SELECT
            COUNT(*) FILTER (WHERE event_type = 'whatsapp_click')::int AS whatsapp_clicks,
            COUNT(*) FILTER (WHERE event_type IN ('porto_click', 'cta_primary_click'))::int AS primary_ctas,
            COUNT(*) FILTER (WHERE event_type = 'cta_secondary_click')::int AS secondary_ctas,
            COUNT(*) FILTER (WHERE event_type = 'important_link_click')::int AS important_links,
            COUNT(*) FILTER (WHERE event_type = 'scroll_relevant')::int AS scroll_relevant,
            COUNT(*) FILTER (WHERE event_type = 'thank_you_view')::int AS thank_you_views
          FROM conversion_events
          WHERE created_at BETWEEN ${from} AND ${to}
        ),
        lead_base AS (
          SELECT COUNT(*)::int AS leads
          FROM leads
          WHERE created_at BETWEEN ${from} AND ${to}
        )
        SELECT
          s.total AS sessions,
          p.total AS page_views,
          e.whatsapp_clicks,
          e.primary_ctas,
          e.secondary_ctas,
          e.important_links,
          e.scroll_relevant,
          e.thank_you_views,
          l.leads
        FROM sessions s
        CROSS JOIN page_base p
        CROSS JOIN event_base e
        CROSS JOIN lead_base l
      `,
      sql`
        SELECT
          CASE
            WHEN COALESCE(utm_medium, '') ILIKE '%cpc%'
              OR COALESCE(utm_medium, '') ILIKE '%ppc%'
              OR COALESCE(utm_medium, '') ILIKE '%paid%'
              OR COALESCE(utm_source, '') ILIKE '%google%'
              OR COALESCE(utm_source, '') ILIKE '%meta%'
              OR COALESCE(utm_source, '') ILIKE '%facebook%'
              OR COALESCE(utm_source, '') ILIKE '%instagram%' THEN 'paid'
            WHEN COALESCE(utm_medium, '') ILIKE '%organic%'
              OR COALESCE(referrer, '') ILIKE '%google.%'
              OR COALESCE(referrer, '') ILIKE '%bing.%'
              OR COALESCE(referrer, '') ILIKE '%yahoo.%' THEN 'organic'
            WHEN NULLIF(TRIM(COALESCE(referrer, '')), '') IS NOT NULL THEN 'referral'
            ELSE 'direct'
          END AS channel,
          COUNT(*)::int AS page_views,
          COUNT(DISTINCT session_id)::int AS sessions
        FROM page_views
        WHERE created_at BETWEEN ${from} AND ${to}
        GROUP BY 1
        ORDER BY page_views DESC
      `,
      sql`
        SELECT
          CASE
            WHEN COALESCE(user_agent, '') ILIKE '%ipad%'
              OR COALESCE(user_agent, '') ILIKE '%tablet%' THEN 'Tablet'
            WHEN COALESCE(user_agent, '') ILIKE '%iphone%'
              OR COALESCE(user_agent, '') ILIKE '%mobile%'
              OR (COALESCE(user_agent, '') ILIKE '%android%' AND COALESCE(user_agent, '') NOT ILIKE '%tablet%') THEN 'Mobile'
            ELSE 'Desktop'
          END AS device,
          COUNT(*)::int AS page_views,
          COUNT(DISTINCT session_id)::int AS sessions
        FROM page_views
        WHERE created_at BETWEEN ${from} AND ${to}
        GROUP BY 1
        ORDER BY page_views DESC
      `,
      sql`
        SELECT event_type, COUNT(*)::int AS total
        FROM conversion_events
        WHERE created_at BETWEEN ${from} AND ${to}
        GROUP BY 1
        ORDER BY total DESC
        LIMIT 10
      `,
      sql`
        WITH ordered AS (
          SELECT
            session_id,
            page_path,
            ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at ASC) AS row_number
          FROM page_views
          WHERE created_at BETWEEN ${from} AND ${to}
            AND session_id IS NOT NULL
        )
        SELECT page_path, COUNT(*)::int AS total
        FROM ordered
        WHERE row_number = 1
        GROUP BY 1
        ORDER BY total DESC
        LIMIT 8
      `,
      sql`
        WITH ordered AS (
          SELECT
            session_id,
            page_path,
            ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at DESC) AS row_number
          FROM page_views
          WHERE created_at BETWEEN ${from} AND ${to}
            AND session_id IS NOT NULL
        )
        SELECT page_path, COUNT(*)::int AS total
        FROM ordered
        WHERE row_number = 1
        GROUP BY 1
        ORDER BY total DESC
        LIMIT 8
      `,
      sql`
        WITH transitions AS (
          SELECT
            page_path,
            LEAD(page_path) OVER (PARTITION BY session_id ORDER BY created_at ASC) AS next_path
          FROM page_views
          WHERE created_at BETWEEN ${from} AND ${to}
            AND session_id IS NOT NULL
        )
        SELECT page_path, next_path, COUNT(*)::int AS total
        FROM transitions
        WHERE next_path IS NOT NULL
          AND page_path <> next_path
        GROUP BY 1, 2
        ORDER BY total DESC
        LIMIT 8
      `,
      sql`
        WITH product_views AS (
          SELECT
            split_part(replace(page_path, '/produtos/', ''), '/', 1) AS slug,
            COUNT(*)::int AS views
          FROM page_views
          WHERE created_at BETWEEN ${from} AND ${to}
            AND page_path LIKE '/produtos/%'
          GROUP BY 1
        ),
        product_clicks AS (
          SELECT
            COALESCE(
              NULLIF(product_slug, ''),
              split_part(replace(COALESCE(page_path, ''), '/produtos/', ''), '/', 1)
            ) AS slug,
            COUNT(*) FILTER (WHERE event_type IN ('porto_click', 'whatsapp_click', 'cta_primary_click'))::int AS commercial_clicks
          FROM conversion_events
          WHERE created_at BETWEEN ${from} AND ${to}
          GROUP BY 1
        ),
        product_leads AS (
          SELECT product_slug AS slug, COUNT(*)::int AS leads
          FROM leads
          WHERE created_at BETWEEN ${from} AND ${to}
            AND product_slug IS NOT NULL
          GROUP BY 1
        )
        SELECT
          COALESCE(v.slug, c.slug, l.slug) AS slug,
          COALESCE(v.views, 0) AS views,
          COALESCE(c.commercial_clicks, 0) AS commercial_clicks,
          COALESCE(l.leads, 0) AS leads
        FROM product_views v
        FULL OUTER JOIN product_clicks c ON c.slug = v.slug
        FULL OUTER JOIN product_leads l ON l.slug = COALESCE(v.slug, c.slug)
        WHERE COALESCE(v.slug, c.slug, l.slug) IS NOT NULL
          AND COALESCE(v.slug, c.slug, l.slug) <> ''
        ORDER BY COALESCE(l.leads, 0) DESC, COALESCE(c.commercial_clicks, 0) DESC, COALESCE(v.views, 0) DESC
        LIMIT 12
      `
    ]);

    const summaryRow = summaryRows[0] || {};
    const totalPageViews = toNumber(summaryRow.page_views);
    const totalSessions = toNumber(summaryRow.sessions);

    const channels = channelsRows.map((row) => ({
      key: row.channel,
      label: mapChannelLabel(row.channel),
      pageViews: toNumber(row.page_views),
      sessions: toNumber(row.sessions),
      share: toPercent(toNumber(row.page_views), totalPageViews)
    }));

    const devices = devicesRows.map((row) => ({
      device: row.device,
      pageViews: toNumber(row.page_views),
      sessions: toNumber(row.sessions),
      share: toPercent(toNumber(row.page_views), totalPageViews)
    }));

    const topEvents = topEventsRows.map((row) => ({
      eventType: row.event_type,
      label: formatEventLabel(row.event_type),
      total: toNumber(row.total)
    }));

    const entryPages = entryPagesRows.map((row) => ({
      pagePath: row.page_path,
      sessions: toNumber(row.total)
    }));

    const exitPages = exitPagesRows.map((row) => ({
      pagePath: row.page_path,
      sessions: toNumber(row.total)
    }));

    const topFlows = flowRows.map((row) => ({
      from: row.page_path,
      to: row.next_path,
      total: toNumber(row.total)
    }));

    const productJourneys = productRows
      .map((row) => ({
        slug: row.slug,
        label: normalizeProductLabel(row.slug),
        views: toNumber(row.views),
        commercialClicks: toNumber(row.commercial_clicks),
        leads: toNumber(row.leads),
        clickRate: toPercent(toNumber(row.commercial_clicks), toNumber(row.views)),
        leadRate: toPercent(toNumber(row.leads), toNumber(row.commercial_clicks))
      }))
      .sort((a, b) => {
        const aCore = CORE_PRODUCT_ORDER.indexOf(a.slug);
        const bCore = CORE_PRODUCT_ORDER.indexOf(b.slug);

        if (aCore !== -1 || bCore !== -1) {
          return (aCore === -1 ? 999 : aCore) - (bCore === -1 ? 999 : bCore);
        }

        return b.leads - a.leads || b.commercialClicks - a.commercialClicks || b.views - a.views;
      });

    const snapshot = {
      status: 'connected',
      statusLabel: 'Tracking próprio ativo',
      reason: 'A leitura comportamental usa page views, eventos e leads captados pelo tracking do site.',
      windowDays: days,
      summary: {
        sessions: totalSessions,
        pageViews: totalPageViews,
        leads: toNumber(summaryRow.leads),
        whatsappClicks: toNumber(summaryRow.whatsapp_clicks),
        primaryCtas: toNumber(summaryRow.primary_ctas),
        secondaryCtas: toNumber(summaryRow.secondary_ctas),
        importantLinks: toNumber(summaryRow.important_links),
        scrollRelevant: toNumber(summaryRow.scroll_relevant),
        thankYouViews: toNumber(summaryRow.thank_you_views),
        avgPagesPerSession: totalSessions ? Number((totalPageViews / totalSessions).toFixed(1)) : 0
      },
      channels,
      devices,
      topEvents,
      entryPages,
      exitPages,
      topFlows,
      productJourneys,
      recommendations: [],
      ga4
    };

    snapshot.recommendations = buildRecommendations(snapshot);
    return snapshot;
  } catch (error) {
    return emptySnapshot(
      days,
      error instanceof Error ? error.message : 'Falha ao montar a leitura comportamental.',
      ga4
    );
  }
}
