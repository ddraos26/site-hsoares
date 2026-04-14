import { encodePageDetailId } from '@/lib/admin/detail-route';

const SPECIAL_PAGE_LABELS = {
  '/': 'Home',
  '/blog': 'Blog',
  '/dashboard': 'Dashboard',
  '/contato': 'Contato',
  '/institucional': 'Institucional'
};

const SPECIAL_SEGMENT_LABELS = {
  'cartao-credito-porto-bank': 'Cartão Porto',
  'conta-digital-porto-bank': 'Conta Digital Porto',
  'seguro-celular': 'Seguro Celular',
  'seguro-viagem': 'Seguro Viagem',
  'seguro-vida-on': 'Seguro de Vida',
  'seguro-auto': 'Seguro Auto',
  'seguro-fianca': 'Seguro Fiança',
  'seguro-imobiliario': 'Seguro Imobiliário',
  'plano-saude': 'Plano de Saúde',
  'azul-por-assinatura': 'Azul por Assinatura'
};

const WORD_REPLACEMENTS = {
  cta: 'CTA',
  seo: 'SEO',
  ads: 'Ads',
  crm: 'CRM',
  whatsapp: 'WhatsApp',
  porto: 'Porto',
  bank: 'Bank',
  h: 'H'
};

function titleizeSegment(value) {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      const replacement = WORD_REPLACEMENTS[part.toLowerCase()];
      if (replacement) return replacement;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

export function normalizePagePath(value) {
  const input = String(value || '').trim();
  if (!input) return '/';

  if (input.startsWith('http://') || input.startsWith('https://')) {
    try {
      const url = new URL(input);
      return `${url.pathname || '/'}${url.search || ''}` || '/';
    } catch {
      return input;
    }
  }

  return input.startsWith('/') ? input : `/${input}`;
}

function resolveTrailingLabel(pagePath) {
  const normalized = normalizePagePath(pagePath);
  const parts = normalized.split('/').filter(Boolean);
  const lastSegment = parts.at(-1) || '';

  return SPECIAL_SEGMENT_LABELS[lastSegment] || titleizeSegment(lastSegment);
}

export function formatPageLabel(pagePath) {
  const normalized = normalizePagePath(pagePath);

  if (SPECIAL_PAGE_LABELS[normalized]) {
    return SPECIAL_PAGE_LABELS[normalized];
  }

  if (normalized.startsWith('/produtos/')) {
    return `Página de ${resolveTrailingLabel(normalized)}`;
  }

  if (normalized.startsWith('/blog/noticia/')) {
    return `Matéria: ${resolveTrailingLabel(normalized)}`;
  }

  if (normalized.startsWith('/blog/')) {
    return `Blog: ${resolveTrailingLabel(normalized)}`;
  }

  if (normalized.startsWith('/dashboard')) {
    return 'Dashboard';
  }

  if (normalized.startsWith('/institucional') || normalized.startsWith('/sobre')) {
    return 'Institucional';
  }

  return titleizeSegment(normalized.replace(/^\/+/, '')) || 'Página';
}

export function replacePagePathWithLabel(text, pagePath) {
  const value = String(text || '').trim();
  const normalized = normalizePagePath(pagePath);

  if (!value) return value;
  if (!normalized) return value;

  const label = formatPageLabel(normalized);
  if (!label) return value;

  if (value === normalized) {
    return label;
  }

  return value.split(normalized).join(label);
}

export function buildDashboardPageDetailHref(pagePath) {
  const normalized = normalizePagePath(pagePath);
  if (!normalized) return '/dashboard/pages';
  return `/dashboard/pages/${encodePageDetailId(normalized)}`;
}
