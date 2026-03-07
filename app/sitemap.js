import { products } from '@/lib/products';
import { absoluteUrl } from '@/lib/site';

export default function sitemap() {
  const now = new Date();
  const staticRoutes = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
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
    ...products.map((product) => ({
      url: absoluteUrl(`/produtos/${product.slug}`),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: product.slug === 'seguro-fianca' ? 0.95 : 0.8
    }))
  ];
}
