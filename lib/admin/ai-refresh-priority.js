import 'server-only';

import { encodePageDetailId } from '@/lib/admin/detail-route';
import { formatPageLabel } from '@/lib/admin/page-presentation';
import { readAdminRuntimeSetting } from '@/lib/admin/runtime-settings-store';
import { readCacheAgeMs, resolveDetailLiveTtlMs } from '@/lib/admin/ai-usage-policy';

function buildPageAuditCacheKey(pagePath) {
  return `page-ai-audit:${pagePath || 'unknown'}`;
}

function buildProductAuditCacheKey(productSlug) {
  return `product-ai-audit:${productSlug || 'unknown'}`;
}

function formatHours(value) {
  const hours = Number(value || 0);
  return `${hours}h`;
}

function formatAgeLabel(ageMs) {
  if (!Number.isFinite(ageMs) || ageMs === Number.POSITIVE_INFINITY) {
    return 'Sem leitura anterior';
  }

  const totalMinutes = Math.max(1, Math.round(ageMs / 60000));
  if (totalMinutes < 60) return `${totalMinutes} min atrás`;

  const totalHours = Math.round(totalMinutes / 60);
  if (totalHours < 24) return `${totalHours}h atrás`;

  const totalDays = Math.round(totalHours / 24);
  return `${totalDays}d atrás`;
}

function buildRefreshStatus({ hasLiveAudit, ageMs, liveTtlMs }) {
  if (!hasLiveAudit) {
    return {
      label: 'Ainda sem leitura da IA',
      tone: 'danger',
      summary: 'Essa rota ainda não recebeu uma leitura viva da IA.'
    };
  }

  if (ageMs >= liveTtlMs) {
    return {
      label: 'Precisa releitura agora',
      tone: 'warning',
      summary: 'A última leitura já venceu para o peso comercial dessa rota.'
    };
  }

  if (ageMs >= liveTtlMs * 0.75) {
    return {
      label: 'Vale releitura em breve',
      tone: 'premium',
      summary: 'Ainda está válida, mas já merece voltar para a fila.'
    };
  }

  return {
    label: 'Leitura ainda segura',
    tone: 'success',
    summary: 'A IA ainda pode reaproveitar a leitura atual sem custo extra.'
  };
}

function buildProductBusinessScore(item) {
  const priority = Number(item?.decision?.scores?.priority || 0);
  const urgency = Number(item?.decision?.scores?.urgency || 0);
  const opportunity = Number(item?.decision?.scores?.opportunity || 0);
  const leads = Number(item?.leads || 0);
  const views = Number(item?.views || 0);

  return Math.round(priority * 0.46 + urgency * 0.34 + opportunity * 0.2 + Math.min(views / 8, 8) + Math.min(leads * 2, 10));
}

function buildPageBusinessScore(item) {
  const priority = Number(item?.decision?.scores?.priority || 0);
  const urgency = Number(item?.decision?.scores?.urgency || 0);
  const opportunity = Number(item?.decision?.scores?.opportunity || 0);
  const leads = Number(item?.leads || 0);
  const views = Number(item?.views || 0);

  return Math.round(priority * 0.42 + urgency * 0.4 + opportunity * 0.18 + Math.min(views / 10, 8) + Math.min(leads * 2, 8));
}

function buildRefreshScore({ businessScore, hasLiveAudit, ageMs, liveTtlMs }) {
  const freshnessPressure = !hasLiveAudit
    ? 32
    : Math.min(38, Math.round((ageMs / Math.max(liveTtlMs, 1)) * 26));

  return Math.round(businessScore + freshnessPressure);
}

async function buildProductQueueItems(products = []) {
  const candidates = [...products]
    .sort((left, right) => buildProductBusinessScore(right) - buildProductBusinessScore(left))
    .slice(0, 6);

  return Promise.all(
    candidates.map(async (item) => {
      const cacheEntry = await readAdminRuntimeSetting(buildProductAuditCacheKey(item.slug)).catch(() => null);
      const cacheValue = cacheEntry?.value || null;
      const liveTtlMs = resolveDetailLiveTtlMs(item?.decision?.scores?.priority || 0);
      const ageMs = readCacheAgeMs(cacheValue?.updatedAt);
      const hasLiveAudit = cacheValue?.audit?.source?.status === 'live';
      const status = buildRefreshStatus({ hasLiveAudit, ageMs, liveTtlMs });
      const businessScore = buildProductBusinessScore(item);

      return {
        id: `product:${item.slug}`,
        entityType: 'product',
        title: item.name,
        subtitle: item.decision?.headline || item.decision?.recommendation?.summary || 'Produto com potencial comercial.',
        reason: item.decision?.diagnosis?.summary || item.decision?.recommendation?.summary || 'Existe espaço claro para melhorar venda ou destravar escala.',
        href: `/dashboard/products/${encodeURIComponent(item.slug)}`,
        priorityLabel: item.decision?.recommendation?.priority || 'Média',
        cadenceLabel: formatHours(liveTtlMs / 3600000),
        ageLabel: formatAgeLabel(ageMs),
        statusLabel: status.label,
        statusTone: status.tone,
        statusSummary: status.summary,
        businessScore,
        refreshScore: buildRefreshScore({ businessScore, hasLiveAudit, ageMs, liveTtlMs }),
        signals: `${item.views || 0} visitas · ${item.clicks || 0} cliques · ${item.leads || 0} leads`
      };
    })
  );
}

async function buildPageQueueItems(pages = []) {
  const candidates = [...pages]
    .sort((left, right) => buildPageBusinessScore(right) - buildPageBusinessScore(left))
    .slice(0, 6);

  return Promise.all(
    candidates.map(async (item) => {
      const cacheEntry = await readAdminRuntimeSetting(buildPageAuditCacheKey(item.pagePath)).catch(() => null);
      const cacheValue = cacheEntry?.value || null;
      const liveTtlMs = resolveDetailLiveTtlMs(item?.decision?.scores?.priority || 0);
      const ageMs = readCacheAgeMs(cacheValue?.updatedAt);
      const hasLiveAudit = cacheValue?.audit?.source?.status === 'live';
      const status = buildRefreshStatus({ hasLiveAudit, ageMs, liveTtlMs });
      const businessScore = buildPageBusinessScore(item);

      return {
        id: `page:${item.pagePath}`,
        entityType: 'page',
        title: formatPageLabel(item.pagePath),
        subtitle: item.decision?.headline || item.decision?.recommendation?.summary || 'Página com oportunidade comercial.',
        reason: item.decision?.diagnosis?.summary || item.decision?.recommendation?.summary || 'Essa página pode destravar clique, lead e venda.',
        href: `/dashboard/pages/${encodePageDetailId(item.pagePath)}`,
        priorityLabel: item.decision?.recommendation?.priority || 'Média',
        cadenceLabel: formatHours(liveTtlMs / 3600000),
        ageLabel: formatAgeLabel(ageMs),
        statusLabel: status.label,
        statusTone: status.tone,
        statusSummary: status.summary,
        businessScore,
        refreshScore: buildRefreshScore({ businessScore, hasLiveAudit, ageMs, liveTtlMs }),
        signals: `${item.views || 0} visitas · ${item.clicks || 0} cliques · ${item.leads || 0} leads`
      };
    })
  );
}

export async function getAiRefreshPrioritySnapshot({ products = [], pages = [] } = {}) {
  const [productItems, pageItems] = await Promise.all([
    buildProductQueueItems(products),
    buildPageQueueItems(pages)
  ]);

  const items = [...productItems, ...pageItems]
    .sort((left, right) => right.refreshScore - left.refreshScore || right.businessScore - left.businessScore)
    .slice(0, 6);

  const firstItem = items[0] || null;

  return {
    headline: firstItem
      ? `${firstItem.title} deve voltar primeiro para a releitura da IA`
      : 'Nenhuma releitura comercial urgente agora',
    summary: firstItem
      ? 'A fila abaixo mistura impacto em venda com idade da última leitura para decidir onde a IA deve olhar primeiro.'
      : 'As leituras principais ainda estão dentro da janela segura.',
    items
  };
}
