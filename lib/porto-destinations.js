const PORTO_PRODUCT_CATALOG_BASE = {
  seguro_auto: {
    productSlug: 'seguro_auto',
    productName: 'Seguro Auto',
    eventName: 'clique_saida_seguro_auto',
    siteProductSlugs: ['seguro-auto'],
    urls: ['http://www.porto.vc/SEGUROAUTO_BX46YJ_086fd71fbcc3422daf98e5167934e695']
  },
  cartao_porto: {
    productSlug: 'cartao_porto',
    productName: 'Cartao Porto Bank',
    eventName: 'clique_saida_cartao_porto',
    siteProductSlugs: ['cartao-credito-porto-bank'],
    urls: ['http://www.porto.vc/CARTAODECREDITOPORTOBANK_BX46YJ_f4c3225ecf55455d9d89261efa53fdba']
  },
  seguro_celular: {
    productSlug: 'seguro_celular',
    productName: 'Seguro Celular',
    eventName: 'clique_saida_seguro_celular',
    siteProductSlugs: ['seguro-celular'],
    urls: ['http://www.porto.vc/SEGUROCELULAR_64947J_ceb456af6b834ea38f9d936efd5813df']
  },
  seguro_viagem: {
    productSlug: 'seguro_viagem',
    productName: 'Seguro Viagem',
    eventName: 'clique_saida_seguro_viagem',
    siteProductSlugs: ['seguro-viagem'],
    urls: ['http://www.porto.vc/VIAGEM_64947J_21f978736285438ca82801123068ff97']
  },
  seguro_residencial: {
    productSlug: 'seguro_residencial',
    productName: 'Seguro Residencial',
    eventName: 'clique_saida_seguro_residencial_essencial',
    siteProductSlugs: ['residencial-essencial'],
    urls: ['http://www.porto.vc/RESIDENCIAESSENCIAL_BX46YJ_bef065486e5e4e8a9a879f428df9d74c']
  },
  seguro_vida: {
    productSlug: 'seguro_vida',
    productName: 'Seguro de Vida',
    eventName: 'clique_saida_seguro_vida_on',
    siteProductSlugs: ['seguro-vida-on'],
    urls: ['http://www.porto.vc/SEGURODEVIDAON_64947J_3f6db323cb5e47be85572e557c7dcf77']
  },
  conta_digital_porto: {
    productSlug: 'conta_digital_porto',
    productName: 'Conta Digital Porto Bank',
    eventName: 'clique_saida_conta_digital_porto',
    siteProductSlugs: ['conta-digital-porto-bank'],
    urls: ['http://www.porto.vc/CONTADIGITALPORTOBANK_64947J_babe026dcf814d6aa219ff48aa2ddaf3']
  },
  seguro_equipamentos_portateis: {
    productSlug: 'seguro_equipamentos_portateis',
    productName: 'Seguro Equipamentos Portateis',
    eventName: 'clique_saida_equipamentos_portateis',
    siteProductSlugs: ['equipamentos-portateis'],
    urls: ['http://www.porto.vc/EQUIPAMENTOSPORTATEIS_BX46YJ_a99e784fb1be44c18348e059cfa4b14c']
  },
  azul_por_assinatura: {
    productSlug: 'azul_por_assinatura',
    productName: 'Azul Por Assinatura',
    eventName: 'clique_saida_azul_por_assinatura',
    siteProductSlugs: ['azul-por-assinatura'],
    urls: ['http://www.porto.vc/AZULPORASSINATURA_64947J_bf6578aa7006410bb39b828d82d19805']
  },
  seguro_foto_video: {
    productSlug: 'seguro_foto_video',
    productName: 'Seguro Foto e Video',
    eventName: 'clique_saida_seguro_foto_video',
    siteProductSlugs: ['seguro-foto-video'],
    urls: ['http://www.porto.vc/SEGUROFOTOEVIDEO_64947J_3f8390fda980467399a04521484c9b4d']
  },
  seguro_notebook_tablet: {
    productSlug: 'seguro_notebook_tablet',
    productName: 'Seguro Notebook e Tablet',
    eventName: 'clique_saida_seguro_notebook_tablet',
    siteProductSlugs: ['seguro-notebook-tablet'],
    urls: ['http://www.porto.vc/SEGURONOTEBOOKETABLET_64947J_c72bbc7e2fca4844a9fbc760454353cd']
  },
  seguro_smart_games: {
    productSlug: 'seguro_smart_games',
    productName: 'Seguro Smart e Games',
    eventName: 'clique_saida_seguro_smart_games',
    siteProductSlugs: ['seguro-smart-games'],
    urls: ['http://www.porto.vc/SEGUROSMARTEGAMES_64947J_c633d49b22dd46d3ba61960d3f60309f']
  }
};

function freezeCatalogEntry(entry) {
  return Object.freeze({
    ...entry,
    siteProductSlugs: Object.freeze([...entry.siteProductSlugs]),
    urls: Object.freeze([...entry.urls])
  });
}

export function normalizePortoDestinationHref(href) {
  const value = String(href || '').trim();

  if (!value) {
    return '';
  }

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host === 'porto.vc' || host === 'www.porto.vc') {
      return `http://www.porto.vc${url.pathname}${url.search}`;
    }
  } catch {
    return value;
  }

  return value;
}

function normalizePortoDestinationHrefWithoutSearch(href) {
  const normalized = normalizePortoDestinationHref(href);

  if (!normalized) {
    return '';
  }

  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();

    if (host === 'porto.vc' || host === 'www.porto.vc') {
      return `http://www.porto.vc${url.pathname}`;
    }
  } catch {
    return normalized.split('?')[0];
  }

  return normalized;
}

export const PORTO_PRODUCT_CATALOG = Object.freeze(
  Object.fromEntries(
    Object.entries(PORTO_PRODUCT_CATALOG_BASE).map(([key, value]) => [key, freezeCatalogEntry(value)])
  )
);

export const portoDestinations = Object.freeze(
  Object.fromEntries(
    Object.values(PORTO_PRODUCT_CATALOG).map((item) => [item.productSlug, Object.freeze([...item.urls])])
  )
);

const PORTO_DESTINATION_LOOKUP = new Map();
const PORTO_PRODUCT_LOOKUP = new Map();

for (const definition of Object.values(PORTO_PRODUCT_CATALOG)) {
  PORTO_PRODUCT_LOOKUP.set(definition.productSlug, definition);

  for (const siteProductSlug of definition.siteProductSlugs) {
    PORTO_PRODUCT_LOOKUP.set(siteProductSlug, definition);
  }

  for (const url of definition.urls) {
    PORTO_DESTINATION_LOOKUP.set(normalizePortoDestinationHref(url), definition);
    PORTO_DESTINATION_LOOKUP.set(normalizePortoDestinationHrefWithoutSearch(url), definition);
  }
}

export function getPortoProductDefinitionByProductSlug(productSlug) {
  return PORTO_PRODUCT_LOOKUP.get(String(productSlug || '').trim()) || null;
}

export function getPortoProductDefinitionFromHref(href) {
  return (
    PORTO_DESTINATION_LOOKUP.get(normalizePortoDestinationHref(href)) ||
    PORTO_DESTINATION_LOOKUP.get(normalizePortoDestinationHrefWithoutSearch(href)) ||
    null
  );
}

export function getPrimaryPortoDestinationByProductSlug(productSlug) {
  return getPortoProductDefinitionByProductSlug(productSlug)?.urls?.[0] || '';
}
