import Link from 'next/link';
import styles from '../blog.module.css';
import { getArticlesByCategory } from '../articles';
import { absoluteUrl, buildPageMetadata } from '../../../lib/site';

export const metadata = buildPageMetadata({
  title: 'Blog Plano de Saúde: rede, reembolso, coparticipação e benefícios',
  description:
    'Guias de Plano de Saúde com foco em rede hospitalar, reembolso, coparticipação, telemedicina e comparação mais clara antes da proposta.',
  path: '/blog/plano-saude',
  image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80'
});

const roadmap = [
  {
    title: 'Como escolher plano por hospital e rede',
    text: 'Rede hospitalar, médico, laboratório e abrangência precisam entrar antes da mensalidade na comparação do plano.'
  },
  {
    title: 'Plano familiar ou empresarial: qual faz sentido?',
    text: 'Formato, elegibilidade, previsibilidade de custo e rotina de uso mudam bastante a decisão entre uma modalidade e outra.'
  },
  {
    title: 'Carência, coparticipação e reajuste sem confusão',
    text: 'Esses termos costumam assustar, mas ficam bem mais simples quando você entende impacto real no bolso e no uso do plano.'
  }
];

export default function BlogPlanoSaudePage() {
  const articles = getArticlesByCategory('plano-saude');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Categoria Plano de Saúde do Blog H Soares Seguros',
    description:
      'Guias de Plano de Saúde com foco em rede, reembolso, coparticipação, telemedicina e benefícios.',
    url: absoluteUrl('/blog/plano-saude'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.pageTitle || item.title,
        url: absoluteUrl(`/blog/noticia/${item.slug}`)
      }))
    }
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={styles.stack}>
        <section className={styles.hero}>
          <div className={styles.heroMain}>
              <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Guia de Plano de Saúde</p>
                <h1 className={styles.sectionTitle}>Plano de Saúde com foco em rede, custo-benefício e decisão segura</h1>
                <p className={styles.sectionSubtitle}>
                  Aqui você encontra conteúdo para comparar rede hospitalar, reembolso, coparticipação e tipo de
                  contrato com mais clareza antes de pedir proposta.
              </p>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.pillDark}>Plano de Saúde</span>
              <span className={styles.pillDark}>2 leituras publicadas</span>
              <span className={styles.pillDark}>Rede e custo-benefício</span>
            </div>

            <div className={styles.heroActions}>
              <Link className={styles.buttonGhost} href="/blog">
                Voltar para home do blog
              </Link>
              <Link className={styles.button} href="/plano-de-saude-por-hospital-e-rede">
                Ir para Plano de Saúde
              </Link>
            </div>

            <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                <strong>Já publicado</strong>
                <span>Rede, reembolso, coparticipação e benefícios de acesso já entram como base desta categoria.</span>
              </div>
              <div className={styles.heroStat}>
                <strong>Decisão com critério</strong>
                <span>O objetivo é ajudar você a olhar além da mensalidade antes de escolher o plano.</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Temas principais</p>
            <h2>Os assuntos que mais pesam na escolha do Plano de Saúde</h2>
            <p>
              Em saúde, o erro mais comum é comparar preço sem entender rede, modelo do plano e forma de uso. Os
              artigos desta categoria atacam justamente esse problema.
            </p>
          </header>

          <div className={styles.topicGrid}>
            {roadmap.map((item) => (
              <article key={item.title} className={styles.topicCard}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Artigos publicados</p>
            <h2>Os primeiros guias de Plano de Saúde já estão no ar</h2>
            <p>
              A estreia desta categoria foca no que realmente trava a decisão: como comparar rede, reembolso e
              coparticipação, e como avaliar os benefícios de acesso e cuidado contínuo dentro da proposta.
            </p>
          </header>

          <div className={styles.newsGrid}>
            {articles.map((item) => (
              <article key={item.slug} className={styles.newsCard}>
                <div className={styles.categoryMedia}>
                  <img className={styles.categoryImage} src={item.heroImage.url} alt={item.heroImage.alt} loading="lazy" />
                  <span className={styles.categoryMediaBadge}>{item.visual.eyebrow}</span>
                </div>

                <div className={styles.newsContent}>
                  <div className={styles.metaRow}>
                    <span className={styles.pill}>{item.date}</span>
                    <span className={styles.pill}>{item.readTime}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                </div>

                <div className={styles.newsFooter}>
                  <div className={styles.tagsRow}>
                    {item.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className={styles.buttonRow}>
                    <Link className={styles.buttonLink} href={`/blog/noticia/${item.slug}`}>
                      Ler artigo
                    </Link>
                    <Link className={styles.buttonMini} href={item.actionHref}>
                      Pedir proposta
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.cta}>
          <div>
            <h2>Quer seguir para a proposta?</h2>
            <p>
              Se você já entendeu os principais pontos de rede, custo e uso, pode seguir para a página de Plano de
              Saúde e pedir a sua proposta.
            </p>
          </div>

          <Link className={styles.button} href="/plano-de-saude-por-hospital-e-rede">
            Abrir Plano de Saúde
          </Link>
        </section>
      </div>
    </main>
  );
}
