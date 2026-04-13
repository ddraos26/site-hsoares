import { products } from '@/lib/products';
import { absoluteUrl } from '@/lib/site';
import { blogCategories } from './blog/data';
import { blogArticles } from './blog/articles';

function normalizeDateToIso(dateText, fallbackDate) {
  if (!dateText) {
    return fallbackDate;
  }

  const normalized = dateText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const monthMap = {
    janeiro: '01',
    fevereiro: '02',
    marco: '03',
    abril: '04',
    maio: '05',
    junho: '06',
    julho: '07',
    agosto: '08',
    setembro: '09',
    outubro: '10',
    novembro: '11',
    dezembro: '12'
  };
  const match = normalized.match(/(\d{1,2}) de ([a-z]+) de (\d{4})/);

  if (!match) {
    return fallbackDate;
  }

  const [, day, monthName, year] = match;
  const month = monthMap[monthName];

  if (!month) {
    return fallbackDate;
  }

  return new Date(`${year}-${month}-${day.padStart(2, '0')}T12:00:00.000Z`);
}

function imageUrl(image) {
  if (!image?.url) {
    return undefined;
  }

  return image.url.startsWith('http') ? image.url : absoluteUrl(image.url);
}

const PRODUCT_PRIORITIES = {
  'seguro-fianca': 0.95,
  'seguro-viagem': 0.93,
  'seguro-celular': 0.92,
  'cartao-credito-porto-bank': 0.91,
  'seguro-vida-on': 0.9
};

export default function sitemap() {
  const now = new Date();
  const staticRoutes = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/blog', priority: 0.94, changeFrequency: 'weekly' },
    { path: '/institucional', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/contato', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/seguradoras', priority: 0.82, changeFrequency: 'monthly' },
    { path: '/seguro-fianca-locaticia', priority: 0.92, changeFrequency: 'weekly' },
    { path: '/seguro-fianca-para-imobiliarias', priority: 0.93, changeFrequency: 'weekly' },
    { path: '/seguro-incendio-locacao', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/plano-de-saude-empresarial-e-familiar', priority: 0.88, changeFrequency: 'weekly' },
    { path: '/plano-de-saude-por-hospital-e-rede', priority: 0.89, changeFrequency: 'weekly' },
    { path: '/cotacao-seguro-auto', priority: 0.89, changeFrequency: 'weekly' },
    { path: '/renovacao-seguro-auto', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/politica-de-privacidade', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/termos-de-uso', priority: 0.4, changeFrequency: 'yearly' }
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority
    })),
    ...blogCategories.map((category) => ({
      url: absoluteUrl(category.href),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: category.slug === 'seguro-celular' ? 0.93 : category.slug === 'cartoes' ? 0.9 : 0.86,
      images: imageUrl({ url: category.image }) ? [imageUrl({ url: category.image })] : undefined
    })),
    ...blogArticles.map((article) => ({
      url: absoluteUrl(`/blog/noticia/${article.slug}`),
      lastModified: normalizeDateToIso(article.date, now),
      changeFrequency: 'monthly',
      priority: article.category === 'seguro-celular' ? 0.88 : 0.82,
      images: [imageUrl(article.cardCoverImage || article.heroImage)].filter(Boolean)
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/produtos/${product.slug}`),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: PRODUCT_PRIORITIES[product.slug] || 0.8,
      images: [imageUrl({ url: product.seoImage || product.heroImage })].filter(Boolean)
    }))
  ];
}
