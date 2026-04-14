import sitemap from '../sitemap';
import { siteConfig } from '@/lib/site';

const siteHostname = new URL(siteConfig.url).hostname;

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function isLocalImageUrl(image) {
  try {
    const url = new URL(image, siteConfig.url);
    return url.hostname === siteHostname;
  } catch {
    return false;
  }
}

function formatEntry(entry) {
  const lastMod = entry.lastModified?.toISOString?.() ?? '';
  const images = (entry.images || [])
    .filter(isLocalImageUrl)
    .map((image) => `    <image:image>\n      <image:loc>${escapeXml(image)}</image:loc>\n    </image:image>`)
    .join('\n');

  return `  <url>\n    <loc>${escapeXml(entry.url)}</loc>\n${lastMod ? `    <lastmod>${escapeXml(lastMod)}</lastmod>\n` : ''}    <changefreq>${escapeXml(entry.changeFrequency)}</changefreq>\n    <priority>${entry.priority.toFixed(2)}</priority>\n${images ? `${images}\n` : ''}  </url>`;
}

export async function GET() {
  const urls = sitemap();
  const content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.map(formatEntry).join('\n')}\n</urlset>`;

  return new Response(content, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
