import { getDb } from '@/lib/db';

function sanitize(value, limit = 160) {
  return String(value || '').trim().slice(0, limit);
}

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatStatus(status) {
  const normalized = String(status || '').toUpperCase();

  return (
    {
      ENABLED: 'Ativa',
      PAUSED: 'Pausada',
      REMOVED: 'Removida',
      UNKNOWN: 'Sem status',
      DRAFT: 'Rascunho'
    }[normalized] || status || 'Sem status'
  );
}

function isLikelyGoogleTraffic(item) {
  const source = normalizeText(item.source);
  const medium = normalizeText(item.medium);
  return source.includes('google') || source.includes('gads') || ['cpc', 'ppc', 'paid', 'paid-search'].includes(medium);
}

function findTrackingMatch(campaignName, trackingItems) {
  const normalizedCampaignName = normalizeText(campaignName);

  if (!normalizedCampaignName) {
    return null;
  }

  const exact = trackingItems.find((item) => normalizeText(item.campaign) === normalizedCampaignName);
  if (exact) return exact;

  const partialMatches = trackingItems.filter((item) => {
    const normalizedTrackingCampaign = normalizeText(item.campaign);
    if (!normalizedTrackingCampaign) return false;
    return (
      normalizedCampaignName.includes(normalizedTrackingCampaign) ||
      normalizedTrackingCampaign.includes(normalizedCampaignName)
    );
  });

  if (!partialMatches.length) return null;

  return partialMatches.sort((a, b) => b.leads - a.leads || b.clicks - a.clicks || b.views - a.views)[0];
}

function buildCampaignScore(item) {
  if (item.impressions === 0 && item.clicks === 0 && item.conversions === 0) {
    return item.status === 'PAUSED' ? 46 : 40;
  }

  let score = 34;
  score += clamp((item.impressions / 1000) * 10, 0, 10);
  score += clamp((item.clicks / 20) * 18, 0, 18);
  score += clamp((item.ctr / 5) * 12, 0, 12);
  score += clamp((item.conversions / 3) * 18, 0, 18);
  score += clamp((item.trackingLeads / 3) * 12, 0, 12);

  if (item.cost > 0 && item.conversions === 0) score -= 16;
  if (item.clicks > 0 && item.conversions === 0) score -= 8;
  if (item.status === 'PAUSED') score -= 4;

  return Math.round(clamp(score, 18, 96));
}

function buildCampaignTone(item) {
  if (item.cost > 0 && item.conversions === 0) return 'danger';
  if (item.conversions > 0) return 'success';
  if (item.clicks > 0 && item.conversions === 0) return 'warning';
  if (item.status === 'PAUSED') return 'premium';
  return 'blue';
}

function buildCampaignMotion(item) {
  if (item.cost > 0 && item.conversions === 0) return 'Revisar antes de investir mais';
  if (item.impressions > 0 && item.clicks === 0) return 'Revisar criativo e segmentação';
  if (item.conversions > 0) return 'Escalar com critério';
  if (item.status === 'PAUSED' && item.impressions === 0) return 'Pronta para ativar com cautela';
  if (item.trackingViews > 0 && item.trackingLeads === 0) return 'Alinhar landing e CTA';
  return 'Monitorar leitura inicial';
}

function buildCampaignNarrative(item) {
  if (item.cost > 0 && item.conversions === 0) {
    return 'Já existe gasto, mas a campanha ainda não devolve conversão. O risco aqui é comprar clique sem retorno comercial.';
  }

  if (item.impressions > 0 && item.clicks === 0) {
    return 'A entrega existe, mas o anúncio ainda não está gerando clique suficiente para validar a proposta.';
  }

  if (item.conversions > 0) {
    return 'Essa campanha já produz sinal de conversão e merece leitura mais fina de escala, CPA e página de destino.';
  }

  if (item.status === 'PAUSED' && item.impressions === 0) {
    return 'A estrutura já está conectada, mas ainda sem aprendizado real. É o momento de organizar naming, tracking e landing antes de reativar.';
  }

  if (item.trackingViews > 0 && item.trackingLeads === 0) {
    return 'O site já recebe atenção ligada a essa frente, mas a captura ainda não acompanha o interesse.';
  }

  return 'A campanha já entrou no radar do admin e agora precisa acumular sinais para decisões mais agressivas.';
}

function buildCampaignRecommendation(item) {
  if (item.cost > 0 && item.conversions === 0) {
    return 'Segure verba nova, revise segmentação, criativo e a landing antes de tentar escalar.';
  }

  if (item.impressions > 0 && item.clicks === 0) {
    return 'Revise headline do anúncio, público e ativos visuais antes de comprar mais alcance.';
  }

  if (item.conversions > 0) {
    return 'Compare CPA com o lead real do site e só então aumente orçamento de forma controlada.';
  }

  if (item.status === 'PAUSED' && item.impressions === 0) {
    return 'Ative somente quando naming, tracking e página estiverem alinhados para não desperdiçar os primeiros cliques.';
  }

  if (item.trackingViews > 0 && item.trackingLeads === 0) {
    return 'Use essa frente para revisar CTA, prova de valor e distribuição da landing.';
  }

  return 'Deixe no radar e observe os primeiros sinais antes de transformar em prioridade alta.';
}

function buildCampaignLabel(source, medium, campaign) {
  return [source || 'sem-source', medium || 'sem-medium', campaign || 'sem-campaign'].join(' / ');
}

function formatTrafficBucketLabel(value) {
  const normalized = normalizeText(value).replace(/\s+/g, '-');

  return (
    {
      'paid-search': 'Pago: pesquisa',
      'paid-social': 'Pago: social',
      'organic-search': 'Orgânico: busca',
      'organic-social': 'Orgânico: social',
      'social-referral': 'Social / referral',
      referral: 'Referral',
      email: 'Email',
      direct: 'Direto',
      unknown: 'Sem bucket'
    }[normalized] || value || 'Sem bucket'
  );
}

function isPaidTrafficBucket(value) {
  return ['paid-search', 'paid-social', 'paid'].includes(normalizeText(value).replace(/\s+/g, '-'));
}

function isDirectTrafficBucket(value) {
  const normalized = normalizeText(value).replace(/\s+/g, '-');
  return normalized === 'direct' || normalized === 'unknown' || normalized === '';
}

function buildTrafficQualityNarrative(summary) {
  if (!summary.totalViews) {
    return 'Assim que o site acumular visitas com tracking, esta leitura separa pago, orgânico/referral e direto para decidir onde vale insistir.';
  }

  if (summary.campaignTaggedShare < 45) {
    return 'Ainda existe muito tráfego sem marcação forte de campanha. Antes de acelerar a verba, vale limpar naming, UTMs e links.';
  }

  if (summary.totalSupportClicks > summary.totalOfficialClicks) {
    return 'Os cliques de apoio já encostam ou passam da rota principal. Vale preservar o clique oficial da Porto como ação dominante antes de abrir mais caminhos.';
  }

  if (summary.paidViews > 0 && summary.totalOfficialClicks === 0) {
    return 'O tráfego pago já está chegando, mas ainda não devolve clique oficial suficiente para leitura segura de intenção comercial.';
  }

  return 'A leitura já separa bem o que chega pago, o que vem orgânico/referral e como esse tráfego reage ao clique oficial da Porto.';
}

export function getDefaultCampaignsRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10)
  };
}

export function resolveCampaignsRange({ from, to } = {}) {
  const fallback = getDefaultCampaignsRange();
  const safeFrom = from || fallback.from;
  const safeTo = to || fallback.to;

  return {
    from: safeFrom,
    to: safeTo,
    fromDate: new Date(`${safeFrom}T00:00:00.000Z`),
    toDate: new Date(`${safeTo}T23:59:59.999Z`)
  };
}

export async function getAdminCampaignsSnapshot({ from, to, q } = {}) {
  const sql = getDb();
  const { from: safeFrom, to: safeTo, fromDate, toDate } = resolveCampaignsRange({ from, to });
  const query = sanitize(q);
  const queryLike = query ? `%${query}%` : null;

  const [campaignRows, trackingRows, trafficQualityRows, ctaPlacementRows] = await Promise.all([
    sql`
      SELECT
        c.id,
        c.external_id,
        c.name,
        c.platform,
        c.status,
        c.created_at,
        p.slug AS product_slug,
        p.name AS product_name,
        COALESCE(SUM(cs.impressions), 0)::int AS impressions,
        COALESCE(SUM(cs.clicks), 0)::int AS clicks,
        COALESCE(SUM(cs.cost), 0)::numeric AS cost,
        COALESCE(SUM(cs.conversions), 0)::int AS conversions,
        MAX(cs.date) AS last_snapshot_date
      FROM campaigns c
      LEFT JOIN products p ON p.id = c.product_id
      LEFT JOIN campaign_snapshots cs
        ON cs.campaign_id = c.id
       AND cs.date BETWEEN ${safeFrom}::date AND ${safeTo}::date
      WHERE c.platform = 'google-ads'
        AND (
          ${queryLike}::text IS NULL
          OR c.name ILIKE ${queryLike}
          OR COALESCE(c.external_id, '') ILIKE ${queryLike}
          OR COALESCE(c.status, '') ILIKE ${queryLike}
          OR COALESCE(p.slug, '') ILIKE ${queryLike}
          OR COALESCE(p.name, '') ILIKE ${queryLike}
        )
      GROUP BY c.id, c.external_id, c.name, c.platform, c.status, c.created_at, p.slug, p.name
      ORDER BY COALESCE(SUM(cs.cost), 0) DESC, COALESCE(SUM(cs.conversions), 0) DESC, c.created_at DESC
    `,
    sql`
      WITH views AS (
        SELECT
          COALESCE(utm_source, '') AS utm_source,
          COALESCE(utm_medium, '') AS utm_medium,
          COALESCE(utm_campaign, '') AS utm_campaign,
          COUNT(*)::int AS views
        FROM page_views
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY 1, 2, 3
      ),
      clicks AS (
        SELECT
          COALESCE(utm_source, '') AS utm_source,
          COALESCE(utm_medium, '') AS utm_medium,
          COALESCE(utm_campaign, '') AS utm_campaign,
          COUNT(*)::int AS clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY 1, 2, 3
      ),
      leads_by_campaign AS (
        SELECT
          COALESCE(utm_source, '') AS utm_source,
          COALESCE(utm_medium, '') AS utm_medium,
          COALESCE(utm_campaign, '') AS utm_campaign,
          COUNT(*)::int AS leads,
          COUNT(*) FILTER (WHERE lead_status = 'ganho')::int AS ganhos,
          COUNT(*) FILTER (WHERE lead_status = 'perdido')::int AS perdidos
        FROM leads
        WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        GROUP BY 1, 2, 3
      )
      SELECT
        COALESCE(v.utm_source, c.utm_source, l.utm_source) AS utm_source,
        COALESCE(v.utm_medium, c.utm_medium, l.utm_medium) AS utm_medium,
        COALESCE(v.utm_campaign, c.utm_campaign, l.utm_campaign) AS utm_campaign,
        COALESCE(v.views, 0)::int AS views,
        COALESCE(c.clicks, 0)::int AS clicks,
        COALESCE(l.leads, 0)::int AS leads,
        COALESCE(l.ganhos, 0)::int AS ganhos,
        COALESCE(l.perdidos, 0)::int AS perdidos,
        ROUND(((COALESCE(c.clicks, 0)::numeric / NULLIF(COALESCE(v.views, 0), 0)) * 100), 2) AS click_rate,
        ROUND(((COALESCE(l.leads, 0)::numeric / NULLIF(COALESCE(c.clicks, 0), 0)) * 100), 2) AS lead_rate
      FROM views v
      FULL OUTER JOIN clicks c
        ON c.utm_source = v.utm_source
       AND c.utm_medium = v.utm_medium
       AND c.utm_campaign = v.utm_campaign
      FULL OUTER JOIN leads_by_campaign l
        ON l.utm_source = COALESCE(v.utm_source, c.utm_source)
       AND l.utm_medium = COALESCE(v.utm_medium, c.utm_medium)
       AND l.utm_campaign = COALESCE(v.utm_campaign, c.utm_campaign)
      WHERE (
        ${queryLike}::text IS NULL
        OR COALESCE(v.utm_source, c.utm_source, l.utm_source, '') ILIKE ${queryLike}
        OR COALESCE(v.utm_medium, c.utm_medium, l.utm_medium, '') ILIKE ${queryLike}
        OR COALESCE(v.utm_campaign, c.utm_campaign, l.utm_campaign, '') ILIKE ${queryLike}
      )
      ORDER BY COALESCE(l.leads, 0) DESC, COALESCE(c.clicks, 0) DESC, COALESCE(v.views, 0) DESC
      LIMIT 100
    `,
    sql`
      WITH landing_views AS (
        SELECT
          COALESCE(NULLIF(payload->>'traffic_bucket', ''), 'unknown') AS traffic_bucket,
          COUNT(*)::int AS views,
          COUNT(*) FILTER (WHERE COALESCE(payload->>'has_campaign_params', 'false') = 'true')::int AS campaign_views,
          COUNT(*) FILTER (WHERE COALESCE(payload->>'has_paid_click_marker', 'false') = 'true')::int AS paid_marker_views
        FROM conversion_events
        WHERE event_type = 'page_view'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND (
            ${queryLike}::text IS NULL
            OR COALESCE(utm_source, '') ILIKE ${queryLike}
            OR COALESCE(utm_medium, '') ILIKE ${queryLike}
            OR COALESCE(utm_campaign, '') ILIKE ${queryLike}
          )
        GROUP BY 1
      ),
      official_clicks AS (
        SELECT
          COALESCE(NULLIF(payload->>'traffic_bucket', ''), 'unknown') AS traffic_bucket,
          COUNT(*)::int AS official_clicks
        FROM conversion_events
        WHERE event_type = 'porto_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND (
            ${queryLike}::text IS NULL
            OR COALESCE(utm_source, '') ILIKE ${queryLike}
            OR COALESCE(utm_medium, '') ILIKE ${queryLike}
            OR COALESCE(utm_campaign, '') ILIKE ${queryLike}
          )
        GROUP BY 1
      ),
      support_clicks AS (
        SELECT
          COALESCE(NULLIF(payload->>'traffic_bucket', ''), 'unknown') AS traffic_bucket,
          COUNT(*)::int AS support_clicks
        FROM conversion_events
        WHERE event_type = 'whatsapp_click'
          AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
          AND (
            ${queryLike}::text IS NULL
            OR COALESCE(utm_source, '') ILIKE ${queryLike}
            OR COALESCE(utm_medium, '') ILIKE ${queryLike}
            OR COALESCE(utm_campaign, '') ILIKE ${queryLike}
          )
        GROUP BY 1
      )
      SELECT
        COALESCE(v.traffic_bucket, o.traffic_bucket, s.traffic_bucket) AS traffic_bucket,
        COALESCE(v.views, 0)::int AS views,
        COALESCE(v.campaign_views, 0)::int AS campaign_views,
        COALESCE(v.paid_marker_views, 0)::int AS paid_marker_views,
        COALESCE(o.official_clicks, 0)::int AS official_clicks,
        COALESCE(s.support_clicks, 0)::int AS support_clicks
      FROM landing_views v
      FULL OUTER JOIN official_clicks o
        ON o.traffic_bucket = v.traffic_bucket
      FULL OUTER JOIN support_clicks s
        ON s.traffic_bucket = COALESCE(v.traffic_bucket, o.traffic_bucket)
      ORDER BY COALESCE(v.views, 0) DESC, COALESCE(o.official_clicks, 0) DESC, COALESCE(s.support_clicks, 0) DESC
      LIMIT 8
    `,
    sql`
      SELECT
        COALESCE(NULLIF(payload->>'cta_placement', ''), 'sem-marcacao') AS placement,
        COUNT(*) FILTER (WHERE event_type = 'porto_click')::int AS official_clicks,
        COUNT(*) FILTER (WHERE event_type = 'whatsapp_click')::int AS support_clicks
      FROM conversion_events
      WHERE event_type IN ('porto_click', 'whatsapp_click')
        AND created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        AND (
          ${queryLike}::text IS NULL
          OR COALESCE(utm_source, '') ILIKE ${queryLike}
          OR COALESCE(utm_medium, '') ILIKE ${queryLike}
          OR COALESCE(utm_campaign, '') ILIKE ${queryLike}
        )
      GROUP BY 1
      ORDER BY COUNT(*) FILTER (WHERE event_type = 'porto_click') DESC, COUNT(*) FILTER (WHERE event_type = 'whatsapp_click') DESC
      LIMIT 6
    `
  ]);

  const trackingItems = trackingRows.map((row) => ({
    source: row.utm_source || '',
    medium: row.utm_medium || '',
    campaign: row.utm_campaign || '',
    label: buildCampaignLabel(row.utm_source, row.utm_medium, row.utm_campaign),
    views: row.views || 0,
    clicks: row.clicks || 0,
    leads: row.leads || 0,
    ganhos: row.ganhos || 0,
    perdidos: row.perdidos || 0,
    clickRate: Number(row.click_rate || 0),
    leadRate: Number(row.lead_rate || 0)
  }));

  const googleTrackingItems = trackingItems.filter(isLikelyGoogleTraffic);
  const trafficQualityItems = trafficQualityRows.map((row) => {
    const views = Number(row.views || 0);
    const officialClicks = Number(row.official_clicks || 0);
    const supportClicks = Number(row.support_clicks || 0);

    return {
      bucket: row.traffic_bucket || 'unknown',
      label: formatTrafficBucketLabel(row.traffic_bucket),
      views,
      campaignViews: Number(row.campaign_views || 0),
      paidMarkerViews: Number(row.paid_marker_views || 0),
      officialClicks,
      supportClicks,
      officialClickRate: views > 0 ? Number(((officialClicks / views) * 100).toFixed(2)) : 0,
      supportClickRate: views > 0 ? Number(((supportClicks / views) * 100).toFixed(2)) : 0
    };
  });
  const ctaPlacementItems = ctaPlacementRows.map((row) => ({
    placement: row.placement || 'sem-marcacao',
    officialClicks: Number(row.official_clicks || 0),
    supportClicks: Number(row.support_clicks || 0),
    totalClicks: Number(row.official_clicks || 0) + Number(row.support_clicks || 0)
  }));

  const items = campaignRows.map((row) => {
    const impressions = Number(row.impressions || 0);
    const clicks = Number(row.clicks || 0);
    const cost = toNumber(row.cost);
    const conversions = Number(row.conversions || 0);
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    const cpc = clicks > 0 ? Number((cost / clicks).toFixed(2)) : 0;
    const cpa = conversions > 0 ? Number((cost / conversions).toFixed(2)) : 0;
    const trackingMatch = findTrackingMatch(row.name, trackingItems);

    const item = {
      id: row.id,
      externalId: row.external_id || '',
      name: row.name,
      platform: row.platform,
      status: String(row.status || 'UNKNOWN').toUpperCase(),
      statusLabel: formatStatus(row.status),
      productSlug: row.product_slug || '',
      productName: row.product_name || '',
      impressions,
      clicks,
      cost,
      conversions,
      ctr,
      cpc,
      cpa,
      lastSnapshotDate: row.last_snapshot_date || null,
      trackingViews: trackingMatch?.views || 0,
      trackingClicks: trackingMatch?.clicks || 0,
      trackingLeads: trackingMatch?.leads || 0,
      trackingLabel: trackingMatch?.label || ''
    };

    const score = buildCampaignScore(item);
    const tone = buildCampaignTone(item);

    return {
      ...item,
      score,
      tone,
      motion: buildCampaignMotion(item),
      narrative: buildCampaignNarrative(item),
      recommendation: buildCampaignRecommendation(item)
    };
  });

  items.sort((a, b) => b.score - a.score || b.conversions - a.conversions || b.clicks - a.clicks || b.impressions - a.impressions);

  const totalSpend = items.reduce((sum, item) => sum + item.cost, 0);
  const totalImpressions = items.reduce((sum, item) => sum + item.impressions, 0);
  const totalClicks = items.reduce((sum, item) => sum + item.clicks, 0);
  const totalConversions = items.reduce((sum, item) => sum + item.conversions, 0);
  const averageCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const averageCpc = totalClicks > 0 ? Number((totalSpend / totalClicks).toFixed(2)) : 0;
  const averageCpa = totalConversions > 0 ? Number((totalSpend / totalConversions).toFixed(2)) : 0;
  const trackedSiteLeads = googleTrackingItems.reduce((sum, item) => sum + item.leads, 0);
  const trafficSummary = trafficQualityItems.reduce(
    (acc, item) => {
      acc.totalViews += item.views;
      acc.totalOfficialClicks += item.officialClicks;
      acc.totalSupportClicks += item.supportClicks;
      acc.campaignTaggedViews += item.campaignViews;
      acc.paidMarkerViews += item.paidMarkerViews;

      if (isPaidTrafficBucket(item.bucket)) {
        acc.paidViews += item.views;
      } else if (isDirectTrafficBucket(item.bucket)) {
        acc.directViews += item.views;
      } else {
        acc.organicViews += item.views;
      }

      return acc;
    },
    {
      totalViews: 0,
      totalOfficialClicks: 0,
      totalSupportClicks: 0,
      paidViews: 0,
      organicViews: 0,
      directViews: 0,
      campaignTaggedViews: 0,
      paidMarkerViews: 0
    }
  );
  trafficSummary.officialClickRate =
    trafficSummary.totalViews > 0
      ? Number(((trafficSummary.totalOfficialClicks / trafficSummary.totalViews) * 100).toFixed(2))
      : 0;
  trafficSummary.campaignTaggedShare =
    trafficSummary.totalViews > 0
      ? Number(((trafficSummary.campaignTaggedViews / trafficSummary.totalViews) * 100).toFixed(2))
      : 0;
  trafficSummary.supportShare =
    trafficSummary.totalOfficialClicks + trafficSummary.totalSupportClicks > 0
      ? Number(
          (
            (trafficSummary.totalSupportClicks / (trafficSummary.totalOfficialClicks + trafficSummary.totalSupportClicks)) *
            100
          ).toFixed(2)
        )
      : 0;
  trafficSummary.narrative = buildTrafficQualityNarrative(trafficSummary);

  const bestCampaign = items.find((item) => item.conversions > 0) || items[0] || null;
  const fixCandidate = items.find((item) => item.cost > 0 && item.conversions === 0) || items.find((item) => item.clicks > 0 && item.conversions === 0) || null;
  const launchCandidate = items.find((item) => item.status === 'PAUSED' && item.impressions === 0) || null;
  const trackingCandidate = trackingItems.find((item) => item.views > 0 && item.leads === 0) || null;

  const summary = {
    totalCampaigns: items.length,
    activeCampaigns: items.filter((item) => item.status === 'ENABLED').length,
    pausedCampaigns: items.filter((item) => item.status === 'PAUSED').length,
    campaignsWithConversions: items.filter((item) => item.conversions > 0).length,
    totalSpend: Number(totalSpend.toFixed(2)),
    totalImpressions,
    totalClicks,
    totalConversions,
    averageCtr,
    averageCpc,
    averageCpa,
    trackedSiteCampaigns: trackingItems.length,
    trackedGoogleCampaigns: googleTrackingItems.length,
    trackedSiteLeads
  };

  return {
    range: { from: safeFrom, to: safeTo },
    account: {
      customerId: sanitize(process.env.GOOGLE_ADS_CUSTOMER_ID || '', 40),
      loginCustomerId: sanitize(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '', 40)
    },
    summary,
    focus: {
      bestCampaign,
      fixCandidate,
      launchCandidate,
      trackingCandidate
    },
    items,
    tracking: {
      summary: {
        totalCampaigns: trackingItems.length,
        totalViews: trackingItems.reduce((sum, item) => sum + item.views, 0),
        totalClicks: trackingItems.reduce((sum, item) => sum + item.clicks, 0),
        totalLeads: trackingItems.reduce((sum, item) => sum + item.leads, 0),
        googleCampaigns: googleTrackingItems.length
      },
      items: trackingItems.slice(0, 8)
    },
    trafficQuality: {
      summary: trafficSummary,
      items: trafficQualityItems.slice(0, 6),
      placements: ctaPlacementItems.slice(0, 6)
    }
  };
}
