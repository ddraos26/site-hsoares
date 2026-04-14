import { unstable_cache } from 'next/cache';
import { getExecutiveDashboardSnapshot } from '@/lib/admin/executive-dashboard';
import { getExecutiveCockpitSnapshot } from '@/lib/admin/executive-cockpit';
import { getSearchConsoleOpportunitySnapshot } from '@/lib/admin/search-console-intelligence';
import { getBehaviorIntelligenceSnapshot } from '@/lib/admin/behavior-intelligence';
import { getAdminProductsSnapshot } from '@/lib/admin/products-overview';
import { getAdminCampaignsSnapshot } from '@/lib/admin/campaigns-overview';
import { getAdminPagesSnapshot } from '@/lib/admin/pages-overview';
import { getAdminDecisionEngineSnapshot } from '@/lib/admin/decision-engine';
import { getAdminIntegrationSnapshot } from '@/lib/admin/integration-status';
import { getAdminTasksSnapshot } from '@/lib/admin/tasks-overview';
import { getAdminOperationalSnapshot } from '@/lib/admin/operational-dashboard';

const CORE_PRODUCTS = [
  { slug: 'cartao-credito-porto-bank' },
  { slug: 'seguro-celular' },
  { slug: 'seguro-viagem' },
  { slug: 'seguro-vida-on' }
];

const executiveDashboardCache = unstable_cache(async () => getExecutiveDashboardSnapshot(), ['admin-snapshot-executive-dashboard'], {
  revalidate: 30
});

const executiveCockpitCache = unstable_cache(async () => getExecutiveCockpitSnapshot(), ['admin-snapshot-executive-cockpit'], {
  revalidate: 30
});

const searchConsoleCache = unstable_cache(async () => getSearchConsoleOpportunitySnapshot(CORE_PRODUCTS), ['admin-snapshot-search-console'], {
  revalidate: 120
});

const behaviorAnalyticsCache = unstable_cache(async () => getBehaviorIntelligenceSnapshot({ days: 30 }), ['admin-snapshot-behavior-analytics'], {
  revalidate: 60
});

const decisionEngineCache = unstable_cache(async () => getAdminDecisionEngineSnapshot(), ['admin-snapshot-decision-engine'], {
  revalidate: 45
});

const integrationSnapshotCache = unstable_cache(async () => getAdminIntegrationSnapshot(), ['admin-snapshot-integrations'], {
  revalidate: 45
});

const tasksSnapshotCache = unstable_cache(async () => getAdminTasksSnapshot(), ['admin-snapshot-tasks'], {
  revalidate: 20
});

const operationalSnapshotCache = unstable_cache(async () => getAdminOperationalSnapshot(), ['admin-snapshot-operational'], {
  revalidate: 20
});

export async function getCachedExecutiveDashboardSnapshot() {
  return executiveDashboardCache();
}

export async function getCachedExecutiveCockpitSnapshot() {
  return executiveCockpitCache();
}

export async function getCachedSearchConsoleOpportunitySnapshot() {
  return searchConsoleCache();
}

export async function getCachedBehaviorIntelligenceSnapshot() {
  return behaviorAnalyticsCache();
}

export async function getCachedAdminDecisionEngineSnapshot() {
  return decisionEngineCache();
}

export async function getCachedAdminIntegrationSnapshot() {
  return integrationSnapshotCache();
}

export async function getCachedAdminTasksSnapshot() {
  return tasksSnapshotCache();
}

export async function getCachedAdminOperationalSnapshot() {
  return operationalSnapshotCache();
}

export async function getCachedAdminProductsSnapshot({ from, to, q } = {}) {
  return unstable_cache(
    async () => getAdminProductsSnapshot({ from, to, q }),
    ['admin-snapshot-products', from || 'default-from', to || 'default-to', q || 'all'],
    { revalidate: 45 }
  )();
}

export async function getCachedAdminCampaignsSnapshot({ from, to, q } = {}) {
  return unstable_cache(
    async () => getAdminCampaignsSnapshot({ from, to, q }),
    ['admin-snapshot-campaigns', from || 'default-from', to || 'default-to', q || 'all'],
    { revalidate: 45 }
  )();
}

export async function getCachedAdminPagesSnapshot({ from, to, q } = {}) {
  return unstable_cache(
    async () => getAdminPagesSnapshot({ from, to, q }),
    ['admin-snapshot-pages', from || 'default-from', to || 'default-to', q || 'all'],
    { revalidate: 45 }
  )();
}
