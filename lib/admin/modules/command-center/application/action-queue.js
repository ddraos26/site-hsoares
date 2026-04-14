import { encodePageDetailId } from '@/lib/admin/detail-route';
import { formatPageLabel } from '@/lib/admin/page-presentation';

function toTaskPriority(priorityLabel) {
  if (priorityLabel === 'Muito alta') return 'Urgente';
  if (priorityLabel === 'Alta') return 'Alta';
  if (priorityLabel === 'Média') return 'Média';
  return 'Baixa';
}

function toApprovalRisk(priorityLabel) {
  if (priorityLabel === 'Muito alta' || priorityLabel === 'Alta') return 'Alta';
  if (priorityLabel === 'Média') return 'Média';
  return 'Baixa';
}

function buildProductDetailHref(slug) {
  return buildProductDecisionHref(slug);
}

function buildProductDecisionHref(slug) {
  return `/dashboard/products/${encodeURIComponent(slug)}`;
}

function buildProductLeadHref(slug) {
  return `/admin/leads?product=${encodeURIComponent(slug)}`;
}

function buildPageDetailHref(pagePath) {
  return `/dashboard/pages/${encodePageDetailId(pagePath)}`;
}

function buildPageLeadHref(pagePath, productSlug) {
  if (productSlug) return `/admin/leads?product=${encodeURIComponent(productSlug)}`;
  return `/admin/leads?q=${encodeURIComponent(pagePath)}`;
}

function buildPageOperationHref(pagePath) {
  return buildPageDetailHref(pagePath);
}

function summarizeSignalsForProduct(item) {
  return [`${item.views} visitas`, `${item.clicks} cliques`, `${item.leads} leads`];
}

function summarizeSignalsForPage(item) {
  return [`${item.views} visitas`, `${item.clicks} cliques`, `${item.leads} leads`];
}

function shouldCreateDecisionTask(item) {
  return Number(item?.decision?.scores?.priority || 0) >= 45 || item?.decision?.automation?.requiresApproval;
}

export function buildProductDecisionTasks(snapshot) {
  return (snapshot?.items || [])
    .filter(shouldCreateDecisionTask)
    .slice(0, 6)
    .map((item) => ({
      id: `product-decision:${item.slug}`,
      title: item.decision?.headline || `Revisar ${item.name}`,
      description: item.decision?.diagnosis?.summary || item.decision?.observability?.summary || '',
      recommendation: item.decision?.automation?.nextStep || item.decision?.recommendation?.summary || '',
      priority: toTaskPriority(item.decision?.recommendation?.priority),
      tone: item.decision?.tone || 'premium',
      sourceType: 'product-decision',
      sourceLabel: 'Produtos',
      href: buildProductDecisionHref(item.slug),
      requiresApproval: Boolean(item.decision?.automation?.requiresApproval),
      ownerLabel: item.decision?.automation?.label || 'Sistema',
      productLabel: item.name,
      dueLabel: item.decision?.recommendation?.priority || 'Hoje',
      metadata: [
        ...summarizeSignalsForProduct(item),
        item.decision?.recommendation?.impact || 'Impacto em análise'
      ],
      createdAt: item.lastLeadAt || new Date().toISOString()
    }));
}

export function buildPageDecisionTasks(snapshot) {
  return (snapshot?.items || [])
    .filter(shouldCreateDecisionTask)
    .slice(0, 6)
    .map((item) => ({
      id: `page-decision:${item.pagePath}`,
      title: item.decision?.headline || `Revisar ${formatPageLabel(item.pagePath)}`,
      description: item.decision?.diagnosis?.summary || item.decision?.observability?.summary || '',
      recommendation: item.decision?.automation?.nextStep || item.decision?.recommendation?.summary || '',
      priority: toTaskPriority(item.decision?.recommendation?.priority),
      tone: item.decision?.tone || 'premium',
      sourceType: 'page-decision',
      sourceLabel: 'Páginas',
      href: buildPageDetailHref(item.pagePath),
      requiresApproval: Boolean(item.decision?.automation?.requiresApproval),
      ownerLabel: item.decision?.automation?.label || 'Sistema',
      productLabel: item.pageType || 'Página',
      dueLabel: item.decision?.recommendation?.priority || 'Hoje',
      metadata: [
        ...summarizeSignalsForPage(item),
        item.decision?.recommendation?.impact || 'Impacto em análise'
      ],
      createdAt: item.lastLeadAt || new Date().toISOString()
    }));
}

export function buildProductDecisionApprovals(snapshot) {
  return (snapshot?.items || [])
    .filter((item) => item?.decision?.automation?.requiresApproval)
    .slice(0, 4)
    .map((item) => {
      const links = buildProductDecisionLinks(item);

      return {
        id: `approval:product:${item.slug}`,
        title: item.decision?.headline || `Decidir sobre ${item.name}`,
        reason: item.decision?.diagnosis?.summary || item.decision?.observability?.summary || '',
        recommendation: item.decision?.recommendation?.summary || '',
        impact: item.decision?.recommendation?.impact || 'Impacto comercial em análise',
        risk: toApprovalRisk(item.decision?.recommendation?.priority),
        href: links.contextHref,
        actionLabel: 'Abrir produto',
        sourceType: 'product',
        execution: {
          sourceType: 'product',
          sourceId: item.slug,
          category: 'product-priority',
          executionMode: item.decision?.automation?.requiresApproval ? 'approval_required' : 'automatic_safe',
          taskKey: `product-decision:${item.slug}`,
          reviewTaskKey: `review:product:${item.slug}`,
          contextHref: links.contextHref,
          queueHref: links.queueHref,
          operationHref: links.operationHref,
          siteHref: links.siteHref,
          summary: `Ao aprovar, o sistema fecha a decisão desse produto, registra a execução e cria um acompanhamento automático de impacto.`,
          steps: [
            `Retirar ${item.name} da fila sensível e marcar a decisão como tratada.`,
            `Registrar a execução automática no histórico operacional.`,
            `Abrir revisão pós-automação para validar resposta comercial.`
          ]
        }
      };
    });
}

export function buildPageDecisionApprovals(snapshot) {
  return (snapshot?.items || [])
    .filter((item) => item?.decision?.automation?.requiresApproval || item?.decision?.siteMutationCandidate)
    .sort((left, right) => {
      const leftPreview = left?.decision?.siteMutationCandidate?.applyMode === 'patch_preview' ? 0 : 1;
      const rightPreview = right?.decision?.siteMutationCandidate?.applyMode === 'patch_preview' ? 0 : 1;
      if (leftPreview !== rightPreview) return leftPreview - rightPreview;
      return Number(right?.decision?.scores?.priority || 0) - Number(left?.decision?.scores?.priority || 0);
    })
    .slice(0, 4)
    .map((item) => {
      const links = buildPageDecisionLinks(item);
      const siteMutation = item.decision?.siteMutationCandidate || null;
      const hasVisualRecommendation = Boolean(siteMutation);
      const pageLabel = formatPageLabel(item.pagePath);

      return {
        id: `approval:page:${item.pagePath}`,
        title: item.decision?.headline || `Decidir sobre ${pageLabel}`,
        reason: item.decision?.diagnosis?.summary || item.decision?.observability?.summary || '',
        recommendation: siteMutation?.summary || item.decision?.recommendation?.summary || '',
        impact: item.decision?.recommendation?.impact || 'Impacto comercial em análise',
        risk: toApprovalRisk(item.decision?.recommendation?.priority),
        href: links.contextHref,
        actionLabel: 'Abrir página',
        sourceType: 'page',
        execution: {
          sourceType: 'page',
          sourceId: item.pagePath,
          category: hasVisualRecommendation ? 'site-implementation-brief' : 'page-optimization',
          executionMode: hasVisualRecommendation ? 'operator_handoff' : item.decision?.automation?.requiresApproval ? 'approval_required' : 'automatic_safe',
          taskKey: `page-decision:${item.pagePath}`,
          reviewTaskKey: `review:page:${item.pagePath}`,
          contextHref: links.contextHref,
          queueHref: links.queueHref,
          operationHref: links.operationHref,
          siteHref: links.siteHref,
          siteMutation,
          summary: hasVisualRecommendation
            ? `Ao aprovar, o sistema abre um handoff manual com orientação para implementar no VSCode e acompanhar se deu certo.`
            : `Ao aprovar, o sistema fecha a decisão dessa página, registra a execução e cria um acompanhamento automático de impacto.`,
          steps: hasVisualRecommendation
            ? [
                `Ler a recomendação visual e abrir a página afetada para entender o contexto.`,
                `Implementar a alteração manualmente no código do site pelo VSCode, sem publicação automática pelo admin.`,
                `Voltar ao admin e validar se a mudança deu certo no acompanhamento da página.`
              ]
            : [
                `Retirar ${pageLabel} da fila sensível e marcar a decisão como tratada.`,
                `Registrar a execução automática no histórico operacional.`,
                `Abrir revisão pós-automação para validar resposta de conversão.`
              ]
        }
      };
    });
}

export function buildProductDecisionLinks(item) {
  return {
    contextHref: buildProductDecisionHref(item.slug),
    queueHref: buildProductLeadHref(item.slug),
    operationHref: buildProductDetailHref(item.slug),
    siteHref: item.siteUrl || '/'
  };
}

export function buildPageDecisionLinks(item) {
  return {
    contextHref: buildPageDetailHref(item.pagePath),
    queueHref: buildPageLeadHref(item.pagePath, item.productSlug),
    operationHref: buildPageOperationHref(item.pagePath),
    siteHref: item.siteUrl || '/'
  };
}
