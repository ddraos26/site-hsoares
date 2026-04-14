const DEFAULT_FETCH_URL = process.env.SEO_BASE_URL || 'https://hsoaresseguros.com.br';
const DEFAULT_SITE_URL = process.env.SEO_SITE_URL || DEFAULT_FETCH_URL;

const PUBLIC_ROUTES = [
  '/',
  '/blog',
  '/blog/cartoes',
  '/blog/seguro-celular',
  '/blog/seguro-auto',
  '/blog/plano-saude',
  '/blog/fianca-e-imobiliario',
  '/blog/noticia/seguro-celular-vale-a-pena-2026',
  '/contato',
  '/institucional',
  '/seguradoras',
  '/seguro-fianca-locaticia',
  '/seguro-fianca-para-imobiliarias',
  '/seguro-incendio-locacao',
  '/plano-de-saude-empresarial-e-familiar',
  '/plano-de-saude-por-hospital-e-rede',
  '/cotacao-seguro-auto',
  '/renovacao-seguro-auto',
  '/produtos/seguro-fianca',
  '/produtos/seguro-imobiliario',
  '/produtos/plano-saude',
  '/produtos/seguro-auto',
  '/produtos/seguro-celular',
  '/produtos/cartao-credito-porto-bank',
  '/produtos/seguro-viagem',
  '/produtos/seguro-vida-on'
];

const EXPECTED_SNIPPETS = {
  '/blog/seguro-celular': ['CollectionPage', 'ItemList'],
  '/blog/noticia/seguro-celular-vale-a-pena-2026': ['Article', 'BreadcrumbList', 'FAQPage'],
  '/produtos/seguro-celular': ['Service', 'BreadcrumbList', 'FAQPage'],
  '/produtos/cartao-credito-porto-bank': ['PaymentCard', 'BreadcrumbList', 'FAQPage'],
  '/produtos/seguro-viagem': ['Service', 'BreadcrumbList', 'FAQPage'],
  '/produtos/seguro-vida-on': ['Service', 'BreadcrumbList', 'FAQPage']
};

function normalizeBaseUrl(input) {
  return new URL(input).toString().replace(/\/$/, '');
}

function routeToUrl(baseUrl, route) {
  return route === '/' ? `${baseUrl}/` : `${baseUrl}${route}`;
}

function comparableUrl(value) {
  return value.replace(/\/$/, '');
}

function parseArgs(argv) {
  const values = {
    fetchUrl: null,
    siteUrl: null
  };

  for (const arg of argv) {
    if (arg.startsWith('--site-url=')) {
      values.siteUrl = arg.slice('--site-url='.length);
      continue;
    }

    if (!arg.startsWith('--') && !values.fetchUrl) {
      values.fetchUrl = arg;
    }
  }

  return values;
}

function pick(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

function parseMeta(html) {
  return {
    title: pick(html, /<title>(.*?)<\/title>/is),
    description: pick(html, /<meta name="description" content="(.*?)"/is),
    canonical: pick(html, /<link rel="canonical" href="(.*?)"/is),
    robots: pick(html, /<meta name="robots" content="(.*?)"/is)
  };
}

function logResult(level, message) {
  const icon = level === 'FAIL' ? 'x' : level === 'WARN' ? '!' : 'ok';
  console.log(`[${icon}] ${message}`);
}

async function fetchText(url) {
  const output = execFileSync(
    'curl',
    ['-sS', '-L', '-o', '-', '-w', '\n__STATUS__:%{http_code}\n', url],
    { encoding: 'utf8' }
  );

  const match = output.match(/\n__STATUS__:(\d{3})\n?$/);
  const status = match ? Number(match[1]) : 0;
  const text = match ? output.slice(0, match.index) : output;

  return { status, text };
}

async function auditPage(fetchBaseUrl, siteUrl, route) {
  const targetUrl = routeToUrl(fetchBaseUrl, route);
  const expectedUrl = routeToUrl(siteUrl, route);
  const { status, text } = await fetchText(targetUrl);
  const issues = [];
  const warnings = [];

  if (status !== 200) {
    issues.push(`status ${status}`);
    return { route, expectedUrl, issues, warnings, meta: null };
  }

  const meta = parseMeta(text);

  if (!meta.title) issues.push('sem <title>');
  if (!meta.description) issues.push('sem meta description');
  if (!meta.canonical) issues.push('sem canonical');
  if (!meta.robots) issues.push('sem robots');
  if (meta.canonical && comparableUrl(meta.canonical) !== comparableUrl(expectedUrl)) {
    issues.push(`canonical diferente: ${meta.canonical}`);
  }
  if (meta.robots && meta.robots.toLowerCase() !== 'index, follow') {
    issues.push(`robots inesperado: ${meta.robots}`);
  }
  if (meta.description && meta.description.length < 70) {
    warnings.push(`description curta (${meta.description.length})`);
  }
  if (meta.description && meta.description.length > 180) {
    warnings.push(`description longa (${meta.description.length})`);
  }

  for (const snippet of EXPECTED_SNIPPETS[route] || []) {
    if (!text.includes(snippet)) {
      issues.push(`sem schema ${snippet}`);
    }
  }

  return { route, expectedUrl, targetUrl, issues, warnings, meta };
}

async function auditLogin(fetchBaseUrl) {
  const { status, text } = await fetchText(`${fetchBaseUrl}/login`);
  const meta = parseMeta(text);
  const issues = [];

  if (status !== 200) issues.push(`login status ${status}`);
  if (meta.robots.toLowerCase() !== 'noindex, nofollow') {
    issues.push(`login robots inesperado: ${meta.robots || 'ausente'}`);
  }

  return issues;
}

async function auditRobots(fetchBaseUrl, siteUrl) {
  const { status, text } = await fetchText(`${fetchBaseUrl}/robots.txt`);
  const issues = [];
  const host = new URL(siteUrl).host;

  if (status !== 200) issues.push(`robots.txt status ${status}`);
  if (!text.includes(`Host: ${host}`)) issues.push('Host ausente ou incorreto em robots.txt');
  if (!text.includes(`${siteUrl}/sitemap.xml`)) issues.push('sitemap.xml ausente no robots.txt');
  if (!text.includes(`${siteUrl}/pages-sitemap.xml`)) issues.push('pages-sitemap.xml ausente no robots.txt');

  return issues;
}

async function auditSitemaps(fetchBaseUrl, siteUrl) {
  const sitemapIssues = [];

  const [mainSitemap, imageSitemap] = await Promise.all([
    fetchText(`${fetchBaseUrl}/sitemap.xml`),
    fetchText(`${fetchBaseUrl}/pages-sitemap.xml`)
  ]);

  if (mainSitemap.status !== 200) sitemapIssues.push(`sitemap.xml status ${mainSitemap.status}`);
  if (imageSitemap.status !== 200) sitemapIssues.push(`pages-sitemap.xml status ${imageSitemap.status}`);

  const expectedMainEntries = [
    `${siteUrl}/blog`,
    `${siteUrl}/blog/seguro-celular`,
    `${siteUrl}/blog/noticia/seguro-celular-vale-a-pena-2026`,
    `${siteUrl}/produtos/seguro-auto`,
    `${siteUrl}/produtos/seguro-celular`,
    `${siteUrl}/produtos/cartao-credito-porto-bank`,
    `${siteUrl}/produtos/seguro-viagem`,
    `${siteUrl}/produtos/seguro-vida-on`,
    `${siteUrl}/contato`
  ];

  for (const entry of expectedMainEntries) {
    if (!mainSitemap.text.includes(entry)) {
      sitemapIssues.push(`faltando no sitemap.xml: ${entry}`);
    }
  }

  if (!imageSitemap.text.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) {
    sitemapIssues.push('namespace de imagem ausente no pages-sitemap.xml');
  }

  if (!imageSitemap.text.includes('<image:loc>')) {
    sitemapIssues.push('nenhuma imagem encontrada no pages-sitemap.xml');
  }

  return sitemapIssues;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fetchBaseUrl = normalizeBaseUrl(args.fetchUrl || DEFAULT_FETCH_URL);
  const siteUrl = normalizeBaseUrl(args.siteUrl || DEFAULT_SITE_URL);
  const pageResults = [];
  const allTitles = new Map();

  console.log(`Auditando SEO em ${fetchBaseUrl}`);
  console.log(`Canonical esperado em ${siteUrl}`);

  for (const route of PUBLIC_ROUTES) {
    const result = await auditPage(fetchBaseUrl, siteUrl, route);
    pageResults.push(result);

    if (result.meta?.title) {
      const current = allTitles.get(result.meta.title) || [];
      current.push(result.route);
      allTitles.set(result.meta.title, current);
    }
  }

  const loginIssues = await auditLogin(fetchBaseUrl);
  const robotsIssues = await auditRobots(fetchBaseUrl, siteUrl);
  const sitemapIssues = await auditSitemaps(fetchBaseUrl, siteUrl);

  let failures = 0;
  let warnings = 0;

  for (const result of pageResults) {
    if (result.issues.length) {
      failures += result.issues.length;
      logResult('FAIL', `${result.route}: ${result.issues.join(' | ')}`);
    } else if (result.warnings.length) {
      warnings += result.warnings.length;
      logResult('WARN', `${result.route}: ${result.warnings.join(' | ')}`);
    } else {
      logResult('PASS', `${result.route}: title, description, canonical e robots ok`);
    }
  }

  for (const issue of loginIssues) {
    failures += 1;
    logResult('FAIL', `/login: ${issue}`);
  }

  if (!loginIssues.length) {
    logResult('PASS', '/login: noindex, nofollow ok');
  }

  for (const issue of robotsIssues) {
    failures += 1;
    logResult('FAIL', `robots.txt: ${issue}`);
  }

  if (!robotsIssues.length) {
    logResult('PASS', 'robots.txt: host e sitemaps ok');
  }

  for (const issue of sitemapIssues) {
    failures += 1;
    logResult('FAIL', `sitemaps: ${issue}`);
  }

  if (!sitemapIssues.length) {
    logResult('PASS', 'sitemap.xml e pages-sitemap.xml ok');
  }

  for (const [title, routes] of allTitles.entries()) {
    if (routes.length > 1) {
      warnings += 1;
      logResult('WARN', `title duplicado em ${routes.join(', ')} -> ${title}`);
    }
  }

  console.log(`\nResumo: ${PUBLIC_ROUTES.length} paginas auditadas | ${failures} falhas | ${warnings} avisos`);

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
import { execFileSync } from 'node:child_process';
