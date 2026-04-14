import { google } from 'googleapis';
import { getGoogleAuthClient, getGoogleServiceAccountEmail } from '@/lib/google/client';
import { siteConfig } from '@/lib/site';

const SITE_URL = siteConfig.url.replace(/\/$/, '');
const DOMAIN_PROPERTY = `sc-domain:${new URL(SITE_URL).hostname}`;
const SITEMAP_URLS = [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/pages-sitemap.xml`];

function normalizePropertyId(value) {
  return typeof value === 'string' ? value.replace(/\/$/, '') : '';
}

function resolveSearchConsoleProperty(sites) {
  const entries = sites.data.siteEntry ?? [];
  const candidates = [SITE_URL, `${SITE_URL}/`, DOMAIN_PROPERTY];

  return entries.find((entry) => candidates.some((candidate) => normalizePropertyId(entry.siteUrl) === normalizePropertyId(candidate))) ?? null;
}

async function getSearchConsoleContext() {
  const auth = await getGoogleAuthClient();
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const sites = await searchconsole.sites.list();
  const site = resolveSearchConsoleProperty(sites);
  const serviceAccountEmail = getGoogleServiceAccountEmail();

  if (!site) {
    return {
      searchconsole,
      site: null,
      serviceAccountEmail,
      availableSites: sites.data.siteEntry ?? []
    };
  }

  return { searchconsole, site, serviceAccountEmail, availableSites: sites.data.siteEntry ?? [] };
}

export async function GET() {
  const { searchconsole, site, serviceAccountEmail, availableSites } = await getSearchConsoleContext();

  if (!site) {
    return new Response(
      JSON.stringify({
        error: 'A conta de serviço ainda não tem acesso à propriedade do Search Console.',
        serviceAccountEmail,
        expectedProperties: [SITE_URL, DOMAIN_PROPERTY],
        availableSites
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const propertyId = site.siteUrl;
  const sitemapResponse = await searchconsole.sitemaps.list({ siteUrl: propertyId });

  return new Response(JSON.stringify({ site, propertyId, serviceAccountEmail, sitemaps: sitemapResponse.data.sitemap }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST() {
  try {
    const { searchconsole, site, serviceAccountEmail, availableSites } = await getSearchConsoleContext();

    if (!site) {
      return new Response(
        JSON.stringify({
          error: 'A conta de serviço ainda não tem acesso à propriedade do Search Console.',
          detail: `Adicione ${serviceAccountEmail} como proprietário ou usuário com permissão total na propriedade ${DOMAIN_PROPERTY} ou ${SITE_URL}.`,
          serviceAccountEmail,
          expectedProperties: [SITE_URL, DOMAIN_PROPERTY],
          availableSites
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const propertyId = site.siteUrl;

    await Promise.all(
      SITEMAP_URLS.map((feedpath) => searchconsole.sitemaps.submit({ siteUrl: propertyId, feedpath }))
    );

    const sitemapResponse = await searchconsole.sitemaps.list({ siteUrl: propertyId });

    return new Response(
      JSON.stringify({
        ok: true,
        submitted: SITEMAP_URLS,
        site,
        propertyId,
        serviceAccountEmail,
        sitemaps: sitemapResponse.data.sitemap
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Nao foi possivel reenviar os sitemaps ao Search Console.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
