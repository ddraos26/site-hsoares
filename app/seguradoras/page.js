import Link from 'next/link';
import { InsurerHashOpen } from '@/components/insurer-hash-open';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { insurers } from '@/lib/insurers';
import { absoluteUrl, buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: 'Seguradoras Parceiras',
  description:
    'Conheça as seguradoras parceiras da H Soares Seguros com canais úteis, assistência 24h, sinistro, SAC, ouvidoria e links oficiais.',
  path: '/seguradoras'
});

const schema = [
  buildOrganizationSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Seguradoras parceiras da H Soares',
    itemListElement: insurers.map((insurer, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: insurer.name,
      url: absoluteUrl('/seguradoras')
    }))
  }
];

function ChannelValue({ item }) {
  if (item.href) {
    return (
      <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
        {item.value}
      </a>
    );
  }

  return <span>{item.value}</span>;
}

export default function InsurersPage() {
  return (
    <>
      <StructuredData data={schema} />
      <InsurerHashOpen />
      <SiteHeader />
      <main className="content-page insurers-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Seguradoras</p>
            <h1>Seguradoras parceiras, canais oficiais e telefones úteis para o cliente usar no momento certo.</h1>
            <p className="subhead">
              Esta página reúne as marcas operadas pela H Soares com foco em utilidade real: assistência 24h, sinistro,
              SAC, ouvidoria, links oficiais e produtos atendidos pela corretora. Toque ou clique no card da seguradora
              para abrir os dados.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container insurers-overview-grid">
            <article className="insurers-overview-card">
              <p className="eyebrow">Base operacional</p>
              <h2>{insurers.length} seguradoras reunidas em uma só página</h2>
              <p>
                O objetivo aqui não é só mostrar logo. É deixar os canais realmente úteis organizados, para o cliente
                conseguir agir rápido quando precisar de atendimento, assistência, sinistro ou contato oficial.
              </p>
            </article>
            <article className="insurers-overview-card insurers-overview-card--dark">
              <p className="eyebrow">Como usar</p>
              <ul className="insurers-overview-list">
                <li>Abra o card da seguradora.</li>
                <li>Veja os canais divididos por tipo de serviço.</li>
                <li>Use os links oficiais quando a seguradora centralizar o atendimento no portal próprio.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section section-soft-blue">
          <div className="container">
            <div className="section-head section-head-readable">
              <p className="eyebrow">Canais e assistência</p>
              <h2>Toque na seguradora para abrir os dados oficiais</h2>
              <p>
                A leitura foi organizada por tipo de atendimento para reduzir atrito: assistência 24h, sinistro, SAC,
                ouvidoria e links oficiais. Quando a seguradora concentra o fluxo em portal próprio, o card sinaliza isso.
              </p>
            </div>

            <div className="insurers-grid insurers-grid-premium">
              {insurers.map((insurer) => (
                <details key={insurer.slug} id={insurer.slug} className="insurer-card insurer-card-premium">
                  <summary>
                    <div className="insurer-card-shell">
                      <div className="insurer-card-logo-wrap insurer-card-logo-wrap--premium">
                        <img src={insurer.logo} alt={insurer.name} className="insurer-card-logo" />
                      </div>

                      <div className="insurer-card-copy insurer-card-copy--premium">
                        <div className="insurer-card-headline">
                          <h2>{insurer.name}</h2>
                          <span className="insurer-card-toggle">Abrir canais</span>
                        </div>
                        <p>{insurer.summary}</p>
                        <div className="insurer-tag-row">
                          {insurer.tags.map((tag) => (
                            <span key={tag} className="insurer-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </summary>

                  <div className="insurer-card-panel insurer-card-panel--premium">
                    <div className="insurer-channel-grid">
                      {insurer.channels.map((channel) => (
                        <section key={channel.title} className="insurer-channel-card">
                          <p className="insurer-channel-title">{channel.title}</p>
                          <ul className="insurer-channel-list">
                            {channel.items.map((item) => (
                              <li key={channel.title + item.label}>
                                <strong>{item.label}</strong>
                                <ChannelValue item={item} />
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>

                    <div className="insurer-meta-grid">
                      <div className="insurer-meta-block">
                        <p className="footer-title">Links oficiais</p>
                        <div className="insurer-link-list">
                          {insurer.officialLinks.map((link) => (
                            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="link-btn">
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>

                      <div className="insurer-meta-block">
                        <p className="footer-title">Produtos com a H Soares</p>
                        <div className="insurer-link-list">
                          {insurer.products.map((product) => (
                            <Link key={product.href + product.label} href={product.href} className="link-btn">
                              {product.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="insurer-source-row">
                      <span>Baseado nos canais oficiais da própria seguradora.</span>
                      <a href={insurer.sourceUrl} target="_blank" rel="noopener noreferrer">
                        Conferir fonte oficial
                      </a>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container cta-panel cta-panel-static insurers-cta-panel">
            <div>
              <p className="eyebrow">Apoio H Soares</p>
              <h2>Para contratação e orientação comercial, a H Soares continua sendo o melhor ponto de apoio.</h2>
              <p>
                Para assistência, serviços emergenciais e sinistro, confirme sempre o canal oficial da seguradora no
                momento do uso. Para escolha do produto, comparação e fechamento, fale com a corretora.
              </p>
            </div>
            <div className="cta-row">
              <a className="btn btn-primary" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">
                Falar com a H Soares
              </a>
              <Link className="btn btn-ghost" href="/#produtos">
                Ver produtos
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
