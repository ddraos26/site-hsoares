import 'server-only';

import { google } from 'googleapis';
import { getDb } from '@/lib/db';
import { getGoogleAuthClient, getGoogleServiceAccountEmail } from '@/lib/google/client';
import {
  getIntegrationBlueprint,
  getIntegrationStatusLabel,
  integrationCatalog,
  isIntegrationOperational,
  isIntegrationPrepared,
  revenueStageCopy,
  sortIntegrations
} from '@/lib/admin/integrations';
import { getGoogleAdsSnapshot, getMetaAdsSnapshot, getWhatsAppCrmSnapshot } from '@/lib/admin/revenue-connectors';
import { siteConfig } from '@/lib/site';

const SITE_URL = siteConfig.url.replace(/\/$/, '');
const DOMAIN_PROPERTY = `sc-domain:${new URL(SITE_URL).hostname}`;

function normalizeEnvValue(value) {
  return String(value || '').trim();
}

function shouldExposeIntegration(key) {
  if (key !== 'whatsapp-crm') {
    return true;
  }

  const visibilityOverride = normalizeEnvValue(process.env.ADMIN_SHOW_WHATSAPP_CRM_CARD).toLowerCase();
  if (visibilityOverride === 'true' || visibilityOverride === '1') {
    return true;
  }

  const requiredKeys = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID', 'CRM_API_BASE_URL', 'CRM_API_KEY'];
  return requiredKeys.some((envKey) => normalizeEnvValue(process.env[envKey]));
}

function getMissingEnv(keys = []) {
  return keys.filter((key) => !normalizeEnvValue(process.env[key]));
}

function withStatus(key, payload) {
  const blueprint = getIntegrationBlueprint(key);
  const status = payload.status || 'pending';

  return {
    key,
    title: blueprint?.title || key,
    eyebrow: blueprint?.eyebrow || 'Integração',
    subtitle: blueprint?.subtitle || '',
    description: blueprint?.description || '',
    unlocks: blueprint?.unlocks || [],
    requiredEnv: blueprint?.requiredEnv || [],
    optionalEnv: blueprint?.optionalEnv || [],
    status,
    statusLabel: getIntegrationStatusLabel(status),
    ...payload
  };
}

async function checkLeadDatabase() {
  const missing = getMissingEnv(['DATABASE_URL']);
  if (missing.length) {
    return withStatus('lead-database', {
      status: 'pending',
      reason: 'O banco ainda não está configurado para alimentar leads e follow-ups no admin.',
      missing,
      nextAction: 'Adicionar DATABASE_URL para a base operacional entrar no cockpit.',
      details: ['Sem banco, o admin perde fila comercial, dono do lead, follow-ups e perdas.']
    });
  }

  try {
    const sql = getDb();
    const [row] = await sql`
      SELECT COUNT(*)::int AS total
      FROM leads
    `;

    return withStatus('lead-database', {
      status: 'connected',
      reason: 'Banco operacional disponível e pronto para leitura comercial diária.',
      nextAction: 'Nenhuma ação imediata. A base comercial já entra no copiloto.',
      details: [`Leads já armazenados: ${row?.total || 0}.`]
    });
  } catch (error) {
    return withStatus('lead-database', {
      status: 'partial',
      reason: 'A string do banco existe, mas a leitura operacional falhou.',
      nextAction: 'Validar conexão com Neon/Postgres e disponibilidade da tabela de leads.',
      details: [error instanceof Error ? error.message : 'Erro desconhecido ao consultar leads.']
    });
  }
}

async function checkGoogleAnalytics() {
  const missing = getMissingEnv(['GOOGLE_SERVICE_ACCOUNT_KEY', 'GA4_PROPERTY_ID']);
  if (missing.length === 2) {
    return withStatus('google-analytics', {
      status: 'pending',
      reason: 'A leitura automática de tráfego ainda não foi ligada no admin.',
      missing,
      nextAction: 'Adicionar a conta de serviço do Google e o GA4_PROPERTY_ID.',
      details: ['Sem isso, o copiloto perde visão de páginas quentes e força de tráfego.']
    });
  }

  if (missing.length) {
    return withStatus('google-analytics', {
      status: 'partial',
      reason: 'Há parte da configuração do GA4, mas ainda faltam chaves críticas para ler a propriedade.',
      missing,
      nextAction: 'Completar as variáveis pendentes do GA4 para liberar leitura real.',
      details: ['O admin só deve confiar em tráfego quando a propriedade responde de verdade.']
    });
  }

  try {
    const auth = await getGoogleAuthClient();
    const analytics = google.analyticsdata({ version: 'v1beta', auth });
    const propertyId = normalizeEnvValue(process.env.GA4_PROPERTY_ID);
    const response = await analytics.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }]
      }
    });

    const metricValues = response.data.rows?.[0]?.metricValues || [];
    const activeUsers = Number(metricValues[0]?.value || 0);
    const pageViews = Number(metricValues[1]?.value || 0);

    return withStatus('google-analytics', {
      status: 'connected',
      reason: 'GA4 respondeu corretamente e já abastece leitura de tráfego no cockpit.',
      nextAction: 'Nenhuma ação urgente. O próximo salto é cruzar esse tráfego com custo de mídia.',
      details: [
        `Propriedade validada: ${propertyId}.`,
        `Últimos 7 dias: ${activeUsers} usuários ativos e ${pageViews} visualizações.`
      ]
    });
  } catch (error) {
    return withStatus('google-analytics', {
      status: 'partial',
      reason: 'As credenciais do GA4 existem, mas a leitura da propriedade falhou.',
      nextAction: 'Revisar a conta de serviço, o ID da propriedade e o acesso do projeto ao GA4.',
      details: [error instanceof Error ? error.message : 'Erro desconhecido ao consultar o GA4.']
    });
  }
}

function normalizePropertyId(value) {
  return typeof value === 'string' ? value.replace(/\/$/, '') : '';
}

function resolveSearchConsoleProperty(sites) {
  const entries = sites.data.siteEntry ?? [];
  const candidates = [SITE_URL, `${SITE_URL}/`, DOMAIN_PROPERTY];

  return entries.find((entry) => candidates.some((candidate) => normalizePropertyId(entry.siteUrl) === normalizePropertyId(candidate))) ?? null;
}

async function checkSearchConsole() {
  const missing = getMissingEnv(['GOOGLE_SERVICE_ACCOUNT_KEY']);
  if (missing.length) {
    return withStatus('search-console', {
      status: 'pending',
      reason: 'O admin ainda não tem a conta de serviço do Google para consultar indexação.',
      missing,
      nextAction: 'Adicionar GOOGLE_SERVICE_ACCOUNT_KEY e liberar acesso à propriedade no Search Console.',
      details: [`Propriedades esperadas: ${SITE_URL} ou ${DOMAIN_PROPERTY}.`]
    });
  }

  try {
    const auth = await getGoogleAuthClient();
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const sites = await searchconsole.sites.list();
    const site = resolveSearchConsoleProperty(sites);
    const serviceAccountEmail = getGoogleServiceAccountEmail();

    if (!site) {
      return withStatus('search-console', {
        status: 'partial',
        reason: 'A conta de serviço existe, mas ainda não está autorizada na propriedade certa do Search Console.',
        nextAction: `Adicionar ${serviceAccountEmail} como proprietário ou usuário com permissão total em ${DOMAIN_PROPERTY}.`,
        details: [`Conta de serviço atual: ${serviceAccountEmail}.`]
      });
    }

    const sitemapResponse = await searchconsole.sitemaps.list({ siteUrl: site.siteUrl });
    const sitemaps = sitemapResponse.data.sitemap || [];

    return withStatus('search-console', {
      status: 'connected',
      reason: 'Search Console acessível e pronto para acompanhar sitemaps e saúde de indexação.',
      nextAction: 'Nenhuma ação imediata. Use esse sinal para acompanhar indexação e reenviar sitemaps quando necessário.',
      details: [
        `Propriedade validada: ${site.siteUrl}.`,
        `Sitemaps encontrados: ${sitemaps.length}.`
      ]
    });
  } catch (error) {
    return withStatus('search-console', {
      status: 'partial',
      reason: 'A configuração do Search Console existe, mas a leitura falhou.',
      nextAction: 'Validar o acesso da conta de serviço, a propriedade e a conectividade da API.',
      details: [error instanceof Error ? error.message : 'Erro desconhecido ao consultar o Search Console.']
    });
  }
}

function resolveRevenueStage(items) {
  const meta = items.find((item) => item.key === 'meta-ads');
  const googleAds = items.find((item) => item.key === 'google-ads');
  const crm = items.find((item) => item.key === 'whatsapp-crm');

  const costPrepared = [meta, googleAds].filter(Boolean).every((item) => isIntegrationPrepared(item.status));
  const costOperational = [meta, googleAds].filter(Boolean).every((item) => isIntegrationOperational(item.status));
  const crmPrepared = crm ? isIntegrationPrepared(crm.status) : true;
  const crmOperational = crm ? isIntegrationOperational(crm.status) : true;

  if (costOperational && crmOperational) {
    return 'financial';
  }

  if ((costPrepared && crmPrepared) || costPrepared || crmPrepared) {
    return 'preparing';
  }

  return 'directional';
}

function buildSummary(items) {
  const total = items.length;
  const connected = items.filter((item) => item.status === 'connected').length;
  const ready = items.filter((item) => item.status === 'ready').length;
  const partial = items.filter((item) => item.status === 'partial').length;
  const pending = items.filter((item) => item.status === 'pending').length;
  const stage = resolveRevenueStage(items);
  const nextUnlock = items.find((item) => ['meta-ads', 'google-ads', 'whatsapp-crm'].includes(item.key) && item.status !== 'connected');

  return {
    total,
    connected,
    ready,
    partial,
    pending,
    stage,
    stageLabel: revenueStageCopy[stage].label,
    stageDescription: revenueStageCopy[stage].description,
    nextUnlockKey: nextUnlock?.key || null,
    nextUnlockTitle: nextUnlock?.title || 'Base operacional consolidada',
    nextUnlockDescription:
      nextUnlock?.nextAction ||
      'As camadas principais já estão ligadas. O próximo passo é aprofundar atribuição e fechamento.'
  };
}

export async function getAdminIntegrationSnapshot() {
  const rawItems = await Promise.all([
      checkLeadDatabase(),
      checkGoogleAnalytics(),
      checkSearchConsole(),
      getMetaAdsSnapshot(),
      getGoogleAdsSnapshot(),
      getWhatsAppCrmSnapshot()
    ]);
  const items = sortIntegrations(rawItems.filter((item) => shouldExposeIntegration(item.key)));
  const availableCatalog = integrationCatalog.filter((item) => shouldExposeIntegration(item.key)).length;

  return {
    checkedAt: new Date().toISOString(),
    summary: buildSummary(items),
    items,
    availableCatalog
  };
}
