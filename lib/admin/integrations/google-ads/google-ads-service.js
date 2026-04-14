import 'server-only';

import { getDb } from '@/lib/db';
import { products as catalogProducts } from '@/lib/products';
import { getGoogleAdsSnapshot } from '@/lib/admin/revenue-connectors';
import { google } from 'googleapis';

function normalizeCampaign(item) {
  return {
    id: item.id || '',
    name: item.name || 'Campanha sem nome',
    status: item.status || 'UNKNOWN',
    impressions: Number(item.impressions || 0),
    clicks: Number(item.clicks || 0),
    conversions: Number(item.conversions || 0),
    spend: Number(item.spend || 0)
  };
}

const PRODUCT_MATCHERS = [
  {
    slug: 'cartao-credito-porto-bank',
    terms: ['cartao porto', 'cartão porto', 'porto bank', 'cartao de credito', 'cartão de crédito']
  },
  {
    slug: 'seguro-celular',
    terms: ['seguro celular', 'celular', 'iphone', 'smartphone']
  },
  {
    slug: 'seguro-viagem',
    terms: ['seguro viagem', 'viagem', 'travel']
  },
  {
    slug: 'seguro-vida-on',
    terms: ['seguro vida', 'vida', 'life']
  }
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeEnvValue(value) {
  return String(value || '').trim();
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

async function fetchGoogleAdsJson(pathname, body) {
  const customerId = normalizeEnvValue(process.env.GOOGLE_ADS_CUSTOMER_ID).replace(/-/g, '');
  const developerToken = normalizeEnvValue(process.env.GOOGLE_ADS_DEVELOPER_TOKEN);
  const loginCustomerId = normalizeEnvValue(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID).replace(/-/g, '');
  const accessToken = await getGoogleAdsAccessToken();

  if (!customerId || !developerToken || !accessToken) {
    throw new Error('Credenciais do Google Ads incompletas para mutação.');
  }

  async function run(includeLoginCustomerId) {
    const response = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}${pathname}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'developer-token': developerToken,
        ...(includeLoginCustomerId && loginCustomerId ? { 'login-customer-id': loginCustomerId } : {})
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const raw = await response.text();
    let payload = null;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = raw;
    }

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.error?.details?.[0]?.errors?.[0]?.message ||
        raw ||
        `HTTP ${response.status}`;
      const error = new Error(message);
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  try {
    return await run(Boolean(loginCustomerId));
  } catch (error) {
    const authorizationError =
      error?.payload?.error?.details?.[0]?.errors?.[0]?.errorCode?.authorizationError ||
      '';
    if (loginCustomerId && authorizationError === 'USER_PERMISSION_DENIED') {
      return run(false);
    }
    throw error;
  }
}

function inferProductSlugFromCampaignName(name) {
  const normalized = normalizeText(name);

  for (const matcher of PRODUCT_MATCHERS) {
    if (matcher.terms.some((term) => normalized.includes(normalizeText(term)))) {
      return matcher.slug;
    }
  }

  const fallback = catalogProducts.find((item) => normalized.includes(normalizeText(item.slug)) || normalized.includes(normalizeText(item.name)));
  return fallback?.slug || null;
}

async function loadProductIdsBySlug(sql) {
  const rows = await sql`
    SELECT id, slug
    FROM products
    WHERE is_active = true
  `;

  return new Map(rows.map((row) => [row.slug, row.id]));
}

async function upsertGoogleAdsCampaign(sql, campaign, productIdsBySlug) {
  const externalId = String(campaign.id || '').trim();
  const inferredProductSlug = inferProductSlugFromCampaignName(campaign.name);
  const inferredProductId = inferredProductSlug ? productIdsBySlug.get(inferredProductSlug) || null : null;

  const [existing] = await sql`
    SELECT id
    FROM campaigns
    WHERE external_id = ${externalId}
      AND platform = 'google-ads'
    LIMIT 1
  `;

  if (existing?.id) {
    const [updated] = await sql`
      UPDATE campaigns
      SET
        name = ${campaign.name},
        product_id = COALESCE(${inferredProductId}::uuid, product_id),
        status = ${campaign.status},
        budget_daily = budget_daily
      WHERE id = ${existing.id}
      RETURNING id, product_id
    `;

    return {
      campaignId: updated.id,
      productId: updated.product_id || null,
      inferredProductSlug
    };
  }

  const [inserted] = await sql`
    INSERT INTO campaigns (external_id, name, platform, product_id, status, budget_daily)
    VALUES (${externalId}, ${campaign.name}, 'google-ads', ${inferredProductId}::uuid, ${campaign.status}, 0)
    RETURNING id, product_id
  `;

  return {
    campaignId: inserted.id,
    productId: inserted.product_id || null,
    inferredProductSlug
  };
}

async function upsertGoogleAdsCampaignSnapshot(sql, campaignId, campaign, snapshotDate) {
  const [existing] = await sql`
    SELECT id
    FROM campaign_snapshots
    WHERE campaign_id = ${campaignId}
      AND date = ${snapshotDate}
    LIMIT 1
  `;

  if (existing?.id) {
    await sql`
      UPDATE campaign_snapshots
      SET
        clicks = ${campaign.clicks},
        impressions = ${campaign.impressions},
        ctr = ${campaign.impressions > 0 ? Number(((campaign.clicks / campaign.impressions) * 100).toFixed(2)) : 0},
        cpc = ${campaign.clicks > 0 ? Number((campaign.spend / campaign.clicks).toFixed(2)) : 0},
        cost = ${campaign.spend},
        conversions = ${campaign.conversions},
        cpa = ${campaign.conversions > 0 ? Number((campaign.spend / campaign.conversions).toFixed(2)) : 0}
      WHERE id = ${existing.id}
    `;
    return existing.id;
  }

  const [inserted] = await sql`
    INSERT INTO campaign_snapshots (campaign_id, clicks, impressions, ctr, cpc, cost, conversions, cpa, date)
    VALUES (
      ${campaignId},
      ${campaign.clicks},
      ${campaign.impressions},
      ${campaign.impressions > 0 ? Number(((campaign.clicks / campaign.impressions) * 100).toFixed(2)) : 0},
      ${campaign.clicks > 0 ? Number((campaign.spend / campaign.clicks).toFixed(2)) : 0},
      ${campaign.spend},
      ${campaign.conversions},
      ${campaign.conversions > 0 ? Number((campaign.spend / campaign.conversions).toFixed(2)) : 0},
      ${snapshotDate}
    )
    RETURNING id
  `;

  return inserted.id;
}

export async function getGoogleAdsCampaignSnapshot(options = {}) {
  const snapshot = await getGoogleAdsSnapshot(options);
  const campaigns = (snapshot.campaigns || []).map(normalizeCampaign);

  return {
    checkedAt: new Date().toISOString(),
    integration: {
      key: 'google-ads',
      status: snapshot.status,
      statusLabel: snapshot.statusLabel,
      reason: snapshot.reason,
      nextAction: snapshot.nextAction,
      missing: snapshot.missing || [],
      details: snapshot.details || []
    },
    account: snapshot.account || null,
    summary: snapshot.summary || {
      spend: 0,
      clicks: 0,
      impressions: 0,
      conversions: 0
    },
    campaigns
  };
}

export async function isGoogleAdsConnectionReady() {
  const snapshot = await getGoogleAdsCampaignSnapshot();
  return snapshot.integration.status === 'connected';
}

export async function syncGoogleAdsCampaignSnapshots({ snapshotDate } = {}) {
  const snapshot = await getGoogleAdsCampaignSnapshot({ bypassSuccessCache: true });
  const effectiveDate = snapshotDate || new Date().toISOString().slice(0, 10);

  if (snapshot.integration.status !== 'connected') {
    return {
      checkedAt: new Date().toISOString(),
      status: 'degraded',
      snapshotDate: effectiveDate,
      reason: snapshot.integration.reason,
      campaignsPersisted: 0,
      snapshotsPersisted: 0,
      inferredProducts: 0,
      integration: snapshot.integration
    };
  }

  const sql = getDb();
  const productIdsBySlug = await loadProductIdsBySlug(sql);
  let campaignsPersisted = 0;
  let snapshotsPersisted = 0;
  let inferredProducts = 0;

  for (const campaign of snapshot.campaigns) {
    const { campaignId, inferredProductSlug } = await upsertGoogleAdsCampaign(sql, campaign, productIdsBySlug);
    await upsertGoogleAdsCampaignSnapshot(sql, campaignId, campaign, effectiveDate);
    campaignsPersisted += 1;
    snapshotsPersisted += 1;
    if (inferredProductSlug) {
      inferredProducts += 1;
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    status: 'completed',
    snapshotDate: effectiveDate,
    reason: 'Campanhas do Google Ads sincronizadas e persistidas no banco.',
    campaignsPersisted,
    snapshotsPersisted,
    inferredProducts,
    integration: snapshot.integration,
    summary: snapshot.summary,
    account: snapshot.account
  };
}

export async function pauseGoogleAdsCampaign({ campaignId }) {
  const normalizedCampaignId = String(campaignId || '').trim();
  const customerId = normalizeEnvValue(process.env.GOOGLE_ADS_CUSTOMER_ID).replace(/-/g, '');

  if (!normalizedCampaignId) {
    throw new Error('campaignId é obrigatório para pausar campanha no Google Ads.');
  }

  const payload = await fetchGoogleAdsJson('/campaigns:mutate', {
    operations: [
      {
        update: {
          resourceName: `customers/${customerId}/campaigns/${normalizedCampaignId}`,
          status: 'PAUSED'
        },
        updateMask: 'status'
      }
    ]
  });

  return {
    status: 'completed',
    action: 'pause-campaign',
    campaignId: normalizedCampaignId,
    payload
  };
}
