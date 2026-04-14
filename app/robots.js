import { siteConfig } from '@/lib/site';

export default function robots() {
  const host = new URL(siteConfig.url).host;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/'
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/'
      }
    ],
    sitemap: [`${siteConfig.url}/sitemap.xml`, `${siteConfig.url}/pages-sitemap.xml`],
    host
  };
}
