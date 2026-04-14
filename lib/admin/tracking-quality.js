import 'server-only';

import { getDb } from '@/lib/db';

const WINDOW_DAYS = 30;

function toNumber(value) {
  return Number(value || 0);
}

function toPercent(partial, total) {
  if (!total) return 0;
  return Number(((partial / total) * 100).toFixed(1));
}

function buildMetric(key, label, row) {
  const total = toNumber(row?.total);
  const attributed = toNumber(row?.attributed);
  const campaignTagged = toNumber(row?.campaign_tagged);

  return {
    key,
    label,
    total,
    attributed,
    unattributed: Math.max(0, total - attributed),
    campaignTagged,
    coverage: toPercent(attributed, total),
    campaignCoverage: toPercent(campaignTagged, total)
  };
}

function summarizeTracking(metrics) {
  const measured = metrics.filter((item) => item.total > 0);
  if (!measured.length) {
    return {
      healthScore: 0,
      readyForAi: false,
      status: 'pending',
      statusLabel: 'Sem dados suficientes',
      summary: 'Ainda não há volume recente para avaliar qualidade de tracking.',
      nextAction: 'Gerar algumas visitas e leads reais para validar a atribuição antes de ligar a IA.'
    };
  }

  const healthScore = Number(
    (measured.reduce((acc, item) => acc + item.coverage, 0) / measured.length).toFixed(1)
  );
  const pageViews = metrics.find((item) => item.key === 'page_views');
  const leads = metrics.find((item) => item.key === 'leads');

  const readyForAi =
    healthScore >= 45 &&
    Number(pageViews?.coverage || 0) >= 20 &&
    (Number(leads?.total || 0) === 0 || Number(leads?.coverage || 0) >= 20);

  if (readyForAi) {
    return {
      healthScore,
      readyForAi,
      status: 'healthy',
      statusLabel: 'Tracking confiável',
      summary: `A atribuição já está utilizável: ${pageViews?.coverage || 0}% das visitas e ${leads?.coverage || 0}% dos leads recentes carregam origem.`,
      nextAction: 'Com a IA ligada, vale começar por Missão do Dia, Insights e recomendações comerciais.'
    };
  }

  if ((pageViews?.coverage || 0) === 0 && (leads?.coverage || 0) === 0) {
    return {
      healthScore,
      readyForAi,
      status: 'warning',
      statusLabel: 'Origem ainda se perde',
      summary: 'As campanhas até podem existir, mas a origem não está chegando de forma consistente nas visitas e leads do site.',
      nextAction: 'Preservar UTMs da primeira visita, revisar links de campanha e deixar os próximos dias acumularem dados limpos.'
    };
  }

  return {
    healthScore,
    readyForAi,
    status: 'warning',
    statusLabel: 'Tracking parcial',
    summary: `A atribuição já aparece, mas ainda está irregular: ${pageViews?.coverage || 0}% das visitas e ${leads?.coverage || 0}% dos leads recentes chegam com origem.`,
    nextAction: 'Padronizar naming, validar UTMs nos links pagos e acompanhar a cobertura antes de dar autonomia maior para a IA.'
  };
}

export async function getAdminTrackingQualitySnapshot() {
  if (!process.env.DATABASE_URL) {
    return {
      checkedAt: new Date().toISOString(),
      status: 'pending',
      statusLabel: 'Banco indisponível',
      summary: 'Sem banco não dá para medir qualidade real de tracking.',
      nextAction: 'Configurar DATABASE_URL para acompanhar cobertura de UTMs e eventos.',
      healthScore: 0,
      readyForAi: false,
      metrics: [],
      topSources: []
    };
  }

  try {
    const sql = getDb();
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const [pageRow, eventRow, leadRow, sourceRows] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (
            WHERE COALESCE(utm_source, '') <> ''
               OR COALESCE(utm_medium, '') <> ''
               OR COALESCE(utm_campaign, '') <> ''
          )::int AS attributed,
          COUNT(*) FILTER (WHERE COALESCE(utm_campaign, '') <> '')::int AS campaign_tagged
        FROM page_views
        WHERE created_at >= ${since}
      `,
      sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (
            WHERE COALESCE(utm_source, '') <> ''
               OR COALESCE(utm_medium, '') <> ''
               OR COALESCE(utm_campaign, '') <> ''
          )::int AS attributed,
          COUNT(*) FILTER (WHERE COALESCE(utm_campaign, '') <> '')::int AS campaign_tagged
        FROM conversion_events
        WHERE created_at >= ${since}
      `,
      sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (
            WHERE COALESCE(utm_source, '') <> ''
               OR COALESCE(utm_medium, '') <> ''
               OR COALESCE(utm_campaign, '') <> ''
          )::int AS attributed,
          COUNT(*) FILTER (WHERE COALESCE(utm_campaign, '') <> '')::int AS campaign_tagged
        FROM leads
        WHERE created_at >= ${since}
      `,
      sql`
        SELECT
          COALESCE(NULLIF(utm_source, ''), 'sem-origem') AS source,
          COUNT(*)::int AS total
        FROM page_views
        WHERE created_at >= ${since}
        GROUP BY 1
        ORDER BY total DESC
        LIMIT 5
      `
    ]);

    const metrics = [
      buildMetric('page_views', 'Visitas', pageRow[0]),
      buildMetric('conversion_events', 'Eventos', eventRow[0]),
      buildMetric('leads', 'Leads', leadRow[0])
    ];
    const summary = summarizeTracking(metrics);

    return {
      checkedAt: new Date().toISOString(),
      ...summary,
      metrics,
      topSources: sourceRows.map((row) => ({
        source: row.source === 'sem-origem' ? 'Direto / sem origem' : row.source,
        total: toNumber(row.total)
      }))
    };
  } catch (error) {
    return {
      checkedAt: new Date().toISOString(),
      status: 'warning',
      statusLabel: 'Falha ao medir tracking',
      summary: 'O sistema tentou medir a cobertura dos UTMs, mas a leitura falhou.',
      nextAction: 'Validar banco e tabelas de page_views, conversion_events e leads.',
      healthScore: 0,
      readyForAi: false,
      metrics: [],
      topSources: [],
      details: [error instanceof Error ? error.message : 'Erro desconhecido ao medir tracking.']
    };
  }
}
