import 'server-only';

import { google } from 'googleapis';
import { getDb } from '@/lib/db';
import { getIntegrationBlueprint, getIntegrationStatusLabel } from '@/lib/admin/integrations';

const GOOGLE_ADS_API_VERSION = 'v22';
const META_GRAPH_VERSION = 'v23.0';
const CRM_DEFAULT_HEALTH_PATH = '/health';
const GOOGLE_ADS_SUCCESS_CACHE_TTL_MS = 15 * 60 * 1000;
const GOOGLE_ADS_ERROR_CACHE_TTL_MS = 10 * 60 * 1000;

const googleAdsRuntimeCache =
  globalThis.__hsoaresGoogleAdsRuntimeCache ||
  (globalThis.__hsoaresGoogleAdsRuntimeCache = {
    snapshot: null,
    expiresAt: 0,
    retryAfterAt: 0
  });

function normalizeEnvValue(value) {
  return String(value || '').trim();
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

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {})
    },
    cache: 'no-store'
  });

  const rawText = await response.text();
  let payload = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const detail =
      typeof payload === 'object' && payload
        ? payload?.error?.message || payload?.message || payload?.error?.status || JSON.stringify(payload)
        : rawText || `HTTP ${response.status}`;

    const error = new Error(detail);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function getGoogleAdsAuthorizationError(error) {
  return (
    error?.payload?.[0]?.error?.details?.[0]?.errors?.[0]?.errorCode?.authorizationError ||
    error?.payload?.error?.details?.[0]?.errors?.[0]?.errorCode?.authorizationError ||
    ''
  );
}

function toNumber(value) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCurrency(value) {
  return Number(toNumber(value).toFixed(2));
}

function parseGoogleAdsRows(streamBatches = []) {
  return streamBatches.flatMap((batch) => batch.results || []);
}

function extractGoogleAdsError(error) {
  if (Array.isArray(error?.payload)) {
    return error.payload[0]?.error || null;
  }

  return error?.payload?.error || null;
}

function parseRetryDelaySeconds(value) {
  const match = String(value || '').match(/(\d+)s/i);
  return match ? Number(match[1]) : 0;
}

function formatRetryDelay(seconds) {
  if (!seconds) return 'alguns minutos';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  }

  return `${Math.max(1, minutes)} min`;
}

function toSnapshotDateKey(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value).slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function formatSnapshotDateLabel(value) {
  if (!value) return 'data indisponível';

  const source = toSnapshotDateKey(value);
  const parsed = new Date(`${source}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return source;

  return parsed.toLocaleDateString('pt-BR');
}

function getGoogleAdsQuotaDetails(error) {
  const providerError = extractGoogleAdsError(error);
  const failure = providerError?.details?.find((item) => item?.errors?.length)?.errors?.[0] || null;
  const quotaError = failure?.errorCode?.quotaError || '';

  if (quotaError !== 'RESOURCE_EXHAUSTED') {
    return null;
  }

  return {
    requestId: providerError?.details?.find((item) => item?.requestId)?.requestId || '',
    rateName: failure?.details?.quotaErrorDetails?.rateName || '',
    retrySeconds: parseRetryDelaySeconds(failure?.details?.quotaErrorDetails?.retryDelay)
  };
}

async function loadCachedGoogleAdsSnapshot() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const sql = getDb();
    const [latestRow] = await sql`
      SELECT MAX(cs.date) AS latest_date
      FROM campaign_snapshots cs
      JOIN campaigns c ON c.id = cs.campaign_id
      WHERE c.platform = 'google-ads'
    `;

    if (!latestRow?.latest_date) {
      return null;
    }

    const rows = await sql`
      SELECT
        c.external_id,
        c.name,
        c.status,
        cs.impressions,
        cs.clicks,
        cs.conversions,
        cs.cost
      FROM campaign_snapshots cs
      JOIN campaigns c ON c.id = cs.campaign_id
      WHERE c.platform = 'google-ads'
        AND cs.date = ${latestRow.latest_date}
      ORDER BY cs.cost DESC, cs.conversions DESC, cs.clicks DESC
      LIMIT 10
    `;

    const campaigns = rows.map((row) => ({
      id: row.external_id || '',
      name: row.name || 'Campanha sem nome',
      status: row.status || 'UNKNOWN',
      impressions: Number(row.impressions || 0),
      clicks: Number(row.clicks || 0),
      conversions: Number(row.conversions || 0),
      spend: toCurrency(row.cost || 0)
    }));

    const summary = campaigns.reduce(
      (acc, item) => ({
        spend: toCurrency(acc.spend + item.spend),
        clicks: acc.clicks + item.clicks,
        impressions: acc.impressions + item.impressions,
        conversions: acc.conversions + item.conversions
      }),
      { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    );

    return {
      snapshotDate: toSnapshotDateKey(latestRow.latest_date),
      campaigns,
      summary
    };
  } catch {
    return null;
  }
}

async function getGoogleAdsAccessToken() {
  const clientId = normalizeEnvValue(process.env.GOOGLE_ADS_CLIENT_ID);
  const clientSecret = normalizeEnvValue(process.env.GOOGLE_ADS_CLIENT_SECRET);
  const refreshToken = normalizeEnvValue(process.env.GOOGLE_ADS_REFRESH_TOKEN);

  const oauth = new google.auth.OAuth2(clientId, clientSecret);
  oauth.setCredentials({ refresh_token: refreshToken });
  const accessToken = await oauth.getAccessToken();
  return typeof accessToken === 'string' ? accessToken : accessToken?.token || '';
}

async function queryGoogleAds(query) {
  const customerId = normalizeEnvValue(process.env.GOOGLE_ADS_CUSTOMER_ID).replace(/-/g, '');
  const developerToken = normalizeEnvValue(process.env.GOOGLE_ADS_DEVELOPER_TOKEN);
  const loginCustomerId = normalizeEnvValue(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID).replace(/-/g, '');
  const accessToken = await getGoogleAdsAccessToken();

  if (!accessToken) {
    throw new Error('OAuth do Google Ads não retornou access token.');
  }

  async function runQuery(includeLoginCustomerId) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'developer-token': developerToken
    };

    if (includeLoginCustomerId && loginCustomerId) {
      headers['login-customer-id'] = loginCustomerId;
    }

    return fetchJson(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
      }
    );
  }

  try {
    return await runQuery(Boolean(loginCustomerId));
  } catch (error) {
    if (loginCustomerId && getGoogleAdsAuthorizationError(error) === 'USER_PERMISSION_DENIED') {
      return runQuery(false);
    }
    throw error;
  }
}

function cloneGoogleAdsSnapshot(snapshot) {
  return snapshot ? JSON.parse(JSON.stringify(snapshot)) : snapshot;
}

function getRuntimeGoogleAdsSnapshot({ bypassSuccessCache = false } = {}) {
  const now = Date.now();

  if (!googleAdsRuntimeCache.snapshot) {
    return null;
  }

  if (googleAdsRuntimeCache.retryAfterAt > now) {
    return cloneGoogleAdsSnapshot(googleAdsRuntimeCache.snapshot);
  }

  if (!bypassSuccessCache && googleAdsRuntimeCache.expiresAt > now) {
    return cloneGoogleAdsSnapshot(googleAdsRuntimeCache.snapshot);
  }

  return null;
}

function rememberGoogleAdsSnapshot(snapshot, { successTtlMs = GOOGLE_ADS_SUCCESS_CACHE_TTL_MS, retrySeconds = 0 } = {}) {
  const now = Date.now();

  googleAdsRuntimeCache.snapshot = cloneGoogleAdsSnapshot(snapshot);
  googleAdsRuntimeCache.expiresAt = now + successTtlMs;
  googleAdsRuntimeCache.retryAfterAt = retrySeconds > 0 ? now + retrySeconds * 1000 : 0;
}

export async function getGoogleAdsSnapshot({ bypassSuccessCache = false } = {}) {
  const required = getIntegrationBlueprint('google-ads')?.requiredEnv || [];
  const missing = getMissingEnv(required);

  if (missing.length === required.length) {
    return withStatus('google-ads', {
      status: 'pending',
      reason: 'Ainda não há credenciais do Google Ads para o copiloto começar a entender custo e intenção de busca.',
      missing,
      nextAction: 'Adicionar developer token, OAuth e customer ID do Google Ads.',
      details: ['Sem essa camada, o admin só consegue orientar direção, não verba em reais.'],
      summary: null,
      campaigns: []
    });
  }

  if (missing.length) {
    return withStatus('google-ads', {
      status: 'partial',
      reason: 'Parte da configuração do Google Ads existe, mas a conexão ainda está incompleta.',
      missing,
      nextAction: 'Completar as credenciais pendentes para liberar autenticação do conector.',
      details: ['A recomendação de orçamento só deve entrar quando a autenticação estiver consistente.'],
      summary: null,
      campaigns: []
    });
  }

  const runtimeSnapshot = getRuntimeGoogleAdsSnapshot({ bypassSuccessCache });
  if (runtimeSnapshot) {
    return runtimeSnapshot;
  }

  try {
    const rows = parseGoogleAdsRows(
      await queryGoogleAds(`
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM campaign
        WHERE segments.date DURING LAST_30_DAYS
          AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
        LIMIT 10
      `)
    );

    const [customerRow] = rows;
    const campaigns = rows.map((row) => ({
      id: row.campaign?.id || '',
      name: row.campaign?.name || 'Campanha sem nome',
      status: row.campaign?.status || 'UNKNOWN',
      impressions: Number(row.metrics?.impressions || 0),
      clicks: Number(row.metrics?.clicks || 0),
      conversions: Number(row.metrics?.conversions || 0),
      spend: toCurrency(Number(row.metrics?.costMicros || 0) / 1_000_000)
    }));

    const summary = campaigns.reduce(
      (acc, item) => ({
        spend: toCurrency(acc.spend + item.spend),
        clicks: acc.clicks + item.clicks,
        impressions: acc.impressions + item.impressions,
        conversions: acc.conversions + item.conversions
      }),
      { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    );

    const snapshot = withStatus('google-ads', {
      status: 'connected',
      reason: 'Google Ads autenticado e com leitura inicial de campanhas, custo e intenção de busca.',
      nextAction: 'Próximo passo: cruzar custo com lead e ganho dentro do copiloto para sugerir orçamento.',
      details: [
        `Conta conectada: ${customerRow?.customer?.descriptiveName || normalizeEnvValue(process.env.GOOGLE_ADS_CUSTOMER_ID)}.`,
        `Moeda: ${customerRow?.customer?.currencyCode || 'não informada'}.`
      ],
      account: {
        id: customerRow?.customer?.id || normalizeEnvValue(process.env.GOOGLE_ADS_CUSTOMER_ID),
        name: customerRow?.customer?.descriptiveName || '',
        currencyCode: customerRow?.customer?.currencyCode || 'BRL',
        timeZone: customerRow?.customer?.timeZone || 'America/Sao_Paulo'
      },
      summary,
      campaigns
    });

    rememberGoogleAdsSnapshot(snapshot, {
      successTtlMs: GOOGLE_ADS_SUCCESS_CACHE_TTL_MS
    });

    return snapshot;
  } catch (error) {
    const quotaDetails = getGoogleAdsQuotaDetails(error);
    const cachedSnapshot = quotaDetails ? await loadCachedGoogleAdsSnapshot() : null;

    if (quotaDetails) {
      const snapshot = withStatus('google-ads', {
        status: 'partial',
        reason: cachedSnapshot
          ? 'O Google Ads bateu no limite temporário da API, então o admin caiu para o último snapshot salvo.'
          : 'O Google Ads respondeu com limite temporário de quota na API.',
        nextAction: cachedSnapshot
          ? 'Aguardar a janela de retry do Google antes de forçar nova sincronização. Não parece ser erro de credencial.'
          : 'Aguardar a janela de retry do Google ou reduzir sincronizações manuais. Não parece ser erro de credencial.',
        details: [
          cachedSnapshot
            ? `Último snapshot local salvo em ${formatSnapshotDateLabel(cachedSnapshot.snapshotDate)}.`
            : 'Ainda não existe snapshot local recente para fallback.',
          quotaDetails.rateName ? `Quota afetada: ${quotaDetails.rateName}.` : null,
          quotaDetails.retrySeconds ? `Retry recomendado em ${formatRetryDelay(quotaDetails.retrySeconds)}.` : null,
          quotaDetails.requestId ? `Request ID: ${quotaDetails.requestId}.` : null
        ].filter(Boolean),
        summary: cachedSnapshot?.summary || null,
        campaigns: cachedSnapshot?.campaigns || []
      });

      rememberGoogleAdsSnapshot(snapshot, {
        successTtlMs: Math.max(GOOGLE_ADS_ERROR_CACHE_TTL_MS, quotaDetails.retrySeconds * 1000 || 0),
        retrySeconds: quotaDetails.retrySeconds
      });

      return snapshot;
    }

    const snapshot = withStatus('google-ads', {
      status: 'partial',
      reason: 'As credenciais do Google Ads existem, mas a leitura inicial ainda falhou.',
      nextAction: 'Validar client ID, client secret, refresh token, developer token e acesso da conta.',
      details: [error instanceof Error ? error.message : 'Erro desconhecido ao consultar o Google Ads.'],
      summary: null,
      campaigns: []
    });

    rememberGoogleAdsSnapshot(snapshot, {
      successTtlMs: GOOGLE_ADS_ERROR_CACHE_TTL_MS
    });

    return snapshot;
  }
}

function parseMetaLeadActions(actions = []) {
  return actions.reduce((sum, item) => {
    const actionType = String(item?.action_type || '').toLowerCase();
    if (!actionType.includes('lead')) return sum;
    return sum + toNumber(item?.value || 0);
  }, 0);
}

function buildMetaHeaders() {
  return {
    Authorization: `Bearer ${normalizeEnvValue(process.env.META_ADS_ACCESS_TOKEN)}`
  };
}

export async function getMetaAdsSnapshot() {
  const blueprint = getIntegrationBlueprint('meta-ads');
  const required = blueprint?.requiredEnv || [];
  const optionalMissing = getMissingEnv(blueprint?.optionalEnv || []);
  const missing = getMissingEnv(required);

  if (missing.length === required.length) {
    return withStatus('meta-ads', {
      status: 'pending',
      reason: 'Meta Ads ainda não foi conectado, então o copiloto não enxerga custo por campanha nessa frente.',
      missing,
      nextAction: 'Adicionar access token e account ID do Meta Ads.',
      details: ['Essa é a primeira camada para o admin começar a sugerir verba com base em custo real.'],
      summary: null,
      campaigns: []
    });
  }

  if (missing.length) {
    return withStatus('meta-ads', {
      status: 'partial',
      reason: 'Parte das credenciais do Meta Ads já existe, mas ainda falta completar a configuração.',
      missing,
      nextAction: 'Completar as chaves obrigatórias do Meta Ads.',
      details: ['Sem a conta completa, o admin não consegue cruzar custo, clique e lead.'],
      summary: null,
      campaigns: []
    });
  }

  try {
    const accountId = normalizeEnvValue(process.env.META_ADS_ACCOUNT_ID).replace(/^act_/, '');
    const account = await fetchJson(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/act_${accountId}?fields=id,name,account_status,currency`,
      { headers: buildMetaHeaders() }
    );
    const insights = await fetchJson(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/act_${accountId}/insights?level=campaign&date_preset=last_30d&fields=campaign_id,campaign_name,spend,clicks,impressions,reach,actions&limit=10`,
      { headers: buildMetaHeaders() }
    );

    const campaigns = (insights?.data || []).map((row) => ({
      id: row.campaign_id || '',
      name: row.campaign_name || 'Campanha sem nome',
      spend: toCurrency(row.spend || 0),
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      reach: Number(row.reach || 0),
      conversions: parseMetaLeadActions(row.actions || [])
    }));

    const summary = campaigns.reduce(
      (acc, item) => ({
        spend: toCurrency(acc.spend + item.spend),
        clicks: acc.clicks + item.clicks,
        impressions: acc.impressions + item.impressions,
        conversions: acc.conversions + item.conversions
      }),
      { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    );

    return withStatus('meta-ads', {
      status: 'connected',
      reason: optionalMissing.length
        ? 'Meta Ads conectado com conta e insights. O pixel continua opcional para aprofundar atribuição.'
        : 'Meta Ads conectado com leitura inicial de custo, clique e campanhas.',
      nextAction: 'Próximo passo: cruzar custo do Meta com lead e venda dentro do copiloto.',
      details: [
        `Conta conectada: ${account?.name || accountId}.`,
        `Moeda: ${account?.currency || 'não informada'}.`
      ],
      account: {
        id: account?.id || accountId,
        name: account?.name || '',
        currencyCode: account?.currency || 'BRL',
        status: account?.account_status ?? null
      },
      summary,
      campaigns
    });
  } catch (error) {
    return withStatus('meta-ads', {
      status: 'partial',
      reason: 'As credenciais do Meta Ads existem, mas a leitura inicial da conta ou dos insights falhou.',
      nextAction: 'Validar access token, permissões da conta e o ad account ID informado.',
      details: [error instanceof Error ? error.message : 'Erro desconhecido ao consultar o Meta Ads.'],
      summary: null,
      campaigns: []
    });
  }
}

function buildCrmHeaders() {
  const apiKey = normalizeEnvValue(process.env.CRM_API_KEY);
  const headers = {};

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers['x-api-key'] = apiKey;
  }

  return headers;
}

function buildCrmHealthUrl() {
  const baseUrl = normalizeEnvValue(process.env.CRM_API_BASE_URL).replace(/\/$/, '');
  const healthPath = normalizeEnvValue(process.env.CRM_API_HEALTH_PATH) || CRM_DEFAULT_HEALTH_PATH;
  const normalizedPath = healthPath.startsWith('/') ? healthPath : `/${healthPath}`;
  return `${baseUrl}${normalizedPath}`;
}

export async function getWhatsAppCrmSnapshot() {
  const whatsappKeys = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID'];
  const crmKeys = ['CRM_API_BASE_URL', 'CRM_API_KEY'];
  const whatsappMissing = getMissingEnv(whatsappKeys);
  const crmMissing = getMissingEnv(crmKeys);
  const missing = [...whatsappMissing, ...crmMissing];

  if (missing.length === whatsappKeys.length + crmKeys.length) {
    return withStatus('whatsapp-crm', {
      status: 'pending',
      reason: 'O fechamento profundo ainda não foi ligado, então o copiloto para em lead e não enxerga venda real.',
      missing,
      nextAction: 'Adicionar credenciais do WhatsApp Cloud API e do CRM para fechar o ciclo comercial.',
      details: ['Sem isso, o admin ainda não mede tempo de resposta, conversa útil e venda fechada.'],
      summary: null
    });
  }

  const details = [];
  let phoneData = null;
  let crmData = null;
  let whatsappConnected = false;
  let crmConnected = false;

  try {
    if (!whatsappMissing.length) {
      phoneData = await fetchJson(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${normalizeEnvValue(process.env.WHATSAPP_PHONE_NUMBER_ID)}?fields=display_phone_number,verified_name,quality_rating`,
        {
          headers: {
            Authorization: `Bearer ${normalizeEnvValue(process.env.WHATSAPP_ACCESS_TOKEN)}`
          }
        }
      );
      whatsappConnected = true;
      details.push(`WhatsApp validado: ${phoneData?.display_phone_number || 'número conectado'}.`);
    } else {
      details.push(`WhatsApp pendente: ${whatsappMissing.join(', ')}.`);
    }

    if (!crmMissing.length) {
      crmData = await fetchJson(buildCrmHealthUrl(), {
        headers: buildCrmHeaders()
      });
      crmConnected = true;
      details.push('CRM respondeu ao health check.');
    } else {
      details.push(`CRM pendente: ${crmMissing.join(', ')}.`);
    }
  } catch (error) {
    details.push(error instanceof Error ? error.message : 'Erro desconhecido ao validar WhatsApp/CRM.');
  }

  if (whatsappConnected && crmConnected) {
    return withStatus('whatsapp-crm', {
      status: 'connected',
      reason: 'WhatsApp e CRM responderam corretamente. A base já pode evoluir para fechamento real.',
      nextAction: 'Próximo passo: ligar eventos de conversa, proposta e ganho na rotina do copiloto.',
      details,
      summary: {
        whatsappConnected,
        crmConnected
      },
      whatsapp: phoneData,
      crm: crmData
    });
  }

  if (whatsappMissing.length === 0 || crmMissing.length === 0) {
    return withStatus('whatsapp-crm', {
      status: 'partial',
      reason:
        whatsappConnected || crmConnected
          ? 'Parte do fechamento profundo já respondeu, mas o ciclo ainda não está completo.'
          : 'Há configuração parcial do fechamento profundo, mas a leitura inicial ainda falhou.',
      missing,
      nextAction:
        whatsappMissing.length === 0 && crmMissing.length
          ? 'Completar a conexão do CRM para fechar o ciclo de receita.'
          : crmMissing.length === 0 && whatsappMissing.length
            ? 'Completar as credenciais do WhatsApp Cloud API para medir a conversa comercial.'
            : 'Validar a conexão do WhatsApp Cloud API e do CRM.',
      details,
      summary: {
        whatsappConnected,
        crmConnected
      },
      whatsapp: phoneData,
      crm: crmData
    });
  }

  return withStatus('whatsapp-crm', {
    status: 'pending',
    reason: 'A camada de fechamento profundo ainda não está pronta para validar conversa e venda real.',
    missing,
    nextAction: 'Adicionar credenciais do WhatsApp Cloud API e do CRM.',
    details,
    summary: null
  });
}
