import 'server-only';

import { normalizePagePath } from '@/lib/admin/page-presentation';
import { getProductBySlug } from '@/lib/products';

function isWhatsAppUrl(value) {
  return /wa\.me|whatsapp/i.test(String(value || ''));
}

function isDirectPortoUrl(value) {
  const url = String(value || '').trim();
  if (!url || isWhatsAppUrl(url)) return false;
  return /porto\.vc|portoseguro\.com\.br/i.test(url);
}

function resolveProductSlugFromPagePath(pagePath) {
  const normalized = normalizePagePath(pagePath);
  const match = normalized.match(/^\/produtos\/([^/?#]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

export function resolveEntityConversionGoal({ pagePath = '', productSlug = '' } = {}) {
  const slug = String(productSlug || '').trim() || resolveProductSlugFromPagePath(pagePath);
  const product = slug ? getProductBySlug(slug) : null;
  const portoUrl = String(product?.portoUrl || '').trim();
  const directPorto = isDirectPortoUrl(portoUrl);

  if (product && directPorto) {
    return {
      key: 'porto_direct_click',
      productSlug: product.slug,
      productName: product.name,
      portoUrl,
      supportChannels: 'WhatsApp e formulario entram apenas como apoio para duvidas, nao como meta principal.',
      primaryConversionLabel: 'Clique no link oficial da Porto',
      primaryGoal:
        `Levar a pessoa certa para clicar no link oficial da Porto e seguir na contratacao direta de ${product.name}.`,
      primaryMetric: 'porto_click',
      preferredCta:
        'O botao principal precisa empurrar para o link oficial da Porto com mais clareza do que qualquer CTA de WhatsApp.'
    };
  }

  return {
    key: 'lead_capture',
    productSlug: slug,
    productName: product?.name || '',
    portoUrl,
    supportChannels: 'Formulario e WhatsApp podem funcionar como rota principal de contato quando fizer sentido.',
    primaryConversionLabel: 'Lead ou contato qualificado',
    primaryGoal: 'Gerar lead qualificado ou pedido de contato com menos atrito.',
    primaryMetric: 'lead_or_contact',
    preferredCta: 'O CTA principal pode levar para formulario, WhatsApp ou proxima etapa de contato.'
  };
}

export function buildContactSurfaceSummary({ objective, hasForm = false, hasWhatsapp = false, hasDirectPortoLink = false }) {
  if (objective?.key === 'porto_direct_click') {
    return [
      hasDirectPortoLink ? 'Link oficial da Porto visivel' : 'Link oficial da Porto nao detectado',
      hasWhatsapp ? 'WhatsApp como apoio' : 'WhatsApp nao detectado',
      hasForm ? 'Formulario como apoio' : 'Sem formulario visivel'
    ].join(' · ');
  }

  return [
    hasForm ? 'Formulario visivel' : 'Sem formulario visivel',
    hasWhatsapp ? 'WhatsApp visivel' : 'WhatsApp nao detectado'
  ].join(' · ');
}

export function applyConversionGoalToAudit(audit, objective, scopeLabel = 'pagina') {
  if (!audit || objective?.key !== 'porto_direct_click') {
    return audit;
  }

  const targetName = objective.productName || scopeLabel;
  const outsideAction =
    scopeLabel === 'produto'
      ? `Destacar o clique para o link oficial da Porto como CTA principal nas paginas de ${targetName} e deixar WhatsApp ou formulario apenas como apoio.`
      : `Destacar o clique para o link oficial da Porto como CTA principal desta rota e deixar WhatsApp ou formulario apenas como apoio.`;
  const insideAction =
    scopeLabel === 'produto'
      ? `Reforcar SEO, tracking e leitura do clique oficial da Porto nas paginas de ${targetName}, sem misturar a meta principal com WhatsApp.`
      : 'Reforcar SEO, tracking e leitura do clique oficial da Porto nesta pagina, sem misturar a meta principal com WhatsApp.';
  const acquisitionAction =
    scopeLabel === 'produto'
      ? `Trazer trafego com intencao de contratacao para as paginas de ${targetName} que levam ao link oficial da Porto.`
      : 'Trazer trafego com intencao de contratacao para esta rota que leva ao link oficial da Porto.';

  return {
    ...audit,
    summary:
      scopeLabel === 'produto'
        ? `${targetName}: a meta principal e empurrar o clique no link oficial da Porto; WhatsApp e formulario entram apenas como apoio.`
        : `${targetName}: esta pagina deve empurrar o clique no link oficial da Porto; WhatsApp e formulario entram apenas como apoio.`,
    salesGoal: objective.primaryGoal,
    insidePage: {
      ...audit.insidePage,
      action: insideAction
    },
    outsidePage: {
      ...audit.outsidePage,
      action: outsideAction
    },
    acquisition: {
      ...audit.acquisition,
      action: acquisitionAction
    },
    conversion: {
      diagnosis: 'A conversao principal desta rota e o clique qualificado no link oficial da Porto, nao a ida para o WhatsApp.',
      action: 'Fazer o botao oficial da Porto virar a acao dominante da pagina e medir melhor esse clique.'
    },
    nextActions: [
      outsideAction,
      insideAction,
      'Medir clique no link oficial da Porto e qualidade desse trafego antes de abrir mais rotas de contato.'
    ],
    expectedResult:
      'Com o CTA oficial da Porto mais claro e melhor rastreado, a rota tende a gerar clique mais qualificado e contratacao com menos atrito.'
  };
}

export function isDirectPortoConversionGoal(objective) {
  return objective?.key === 'porto_direct_click';
}

