export const siteConfig = {
  name: 'H Soares Seguros',
  legalName: 'H Soares Corretora de Seguros LTDA',
  title: 'H Soares Seguros | Corretora de Seguros',
  description:
    'Corretora de seguros com 30 anos de mercado, atendimento consultivo e foco em Seguro Fiança, Seguro Auto, Plano de Saúde e proteção para pessoas, imóveis e empresas.',
  url: 'https://hsoaresseguros.com.br',
  locale: 'pt_BR',
  country: 'BR',
  cnpj: '11.194.245.0001-13',
  phone: '+55 11 97206-4288',
  whatsapp: 'https://wa.me/5511972064288?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20H%20Soares%20Seguros',
  email: 'contato@hsoaresseguros.com.br',
  logo: '/assets/HS.png',
  ogImage: '/assets/HS.png'
};

export function absoluteUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalized, siteConfig.url).toString();
}

export function buildPageMetadata({ title, description, path = '/', image, type = 'website' }) {
  const fullTitle = title || siteConfig.title;
  const fullDescription = description || siteConfig.description;
  const canonical = path === '/' ? siteConfig.url : absoluteUrl(path);
  const ogImage = image || absoluteUrl(siteConfig.ogImage);

  return {
    title: fullTitle,
    description: fullDescription,
    alternates: {
      canonical
    },
    openGraph: {
      type,
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      title: fullTitle,
      description: fullDescription,
      url: canonical,
      images: [
        {
          url: ogImage,
          alt: fullTitle
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [ogImage]
    }
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['InsuranceAgency', 'LocalBusiness'],
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl(siteConfig.logo),
    email: siteConfig.email,
    telephone: siteConfig.phone,
    taxID: siteConfig.cnpj,
    areaServed: ['São Paulo', 'Brasil'],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: siteConfig.phone,
        email: siteConfig.email,
        availableLanguage: ['Portuguese']
      }
    ]
  };
}
