import Link from 'next/link';
import styles from '../blog.module.css';
import { getArticlesByCategory } from '../articles';
import { absoluteUrl, buildPageMetadata } from '../../../lib/site';

export const metadata = buildPageMetadata({
  title: 'Blog Seguro Auto: cobertura, franquia, assistência e benefícios',
  description:
    'Guias de Seguro Auto para comparar cobertura, franquia, assistência, serviços e custo-benefício antes da cotação.',
  path: '/blog/seguro-auto',
  image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
});

const roadmap = [
  {
    title: 'Cobertura e franquia precisam ser lidas juntas',
    text: 'O melhor seguro não aparece quando você olha apenas a parcela. Ele aparece quando cobertura, franquia e rotina do carro conversam entre si.'
  },
  {
    title: 'Assistência e serviços ajudam a perceber valor',
    text: 'Check-up, oficina, reparos e suporte no uso real ajudam a mostrar por que algumas apólices entregam mais do que a leitura fria da cobertura.'
  },
  {
    title: 'Cotação boa nasce de comparação bem feita',
    text: 'Antes de pedir proposta, vale entender onde cobertura, benefício e custo realmente fazem diferença para o seu perfil de motorista.'
  }
];

export default function BlogSeguroAutoPage() {
  const articles = getArticlesByCategory('seguro-auto');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Categoria Seguro Auto do Blog H Soares Seguros',
    description:
      'Guias de Seguro Auto para comparar cobertura, franquia, assistência, serviços e custo-benefício antes da cotação.',
    url: absoluteUrl('/blog/seguro-auto'),
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
                <p className={styles.eyebrow}>Guia de Seguro Auto</p>
                <h1 className={styles.sectionTitle}>Seguro Auto com leitura clara sobre cobertura, franquia e custo-benefício</h1>
                <p className={styles.sectionSubtitle}>
                  Aqui você encontra conteúdo para entender cobertura, franquia, assistência, serviços e o que
                  realmente precisa entrar na comparação antes de cotar um seguro auto.
              </p>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.pillDark}>Seguro Auto</span>
              <span className={styles.pillDark}>2 leituras publicadas</span>
              <span className={styles.pillDark}>Foco em decisao real</span>
            </div>

            <div className={styles.heroActions}>
              <Link className={styles.buttonGhost} href="/blog">
                Voltar para home do blog
              </Link>
              <Link className={styles.button} href="/cotacao-seguro-auto">
                Ir para Seguro Auto
              </Link>
            </div>

            <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                <strong>Já publicado</strong>
                <span>Cobertura, franquia, check-up e benefícios práticos do segurado já estão no ar.</span>
              </div>
              <div className={styles.heroStat}>
                <strong>Decisão mais segura</strong>
                <span>O foco aqui é ajudar você a comparar melhor antes de pedir a cotação.</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Temas principais</p>
            <h2>Os assuntos que mais pesam na escolha do Seguro Auto</h2>
            <p>
              Em vez de falar de seguro de forma genérica, esta categoria foca nas dúvidas que realmente travam a
              escolha da apólice.
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
            <h2>Os primeiros guias de Seguro Auto já estão no ar</h2>
            <p>
              Começamos pelos temas que mais ajudam na decisão: como comparar cobertura, franquia e serviços, e
              onde os benefícios da Porto fazem diferença na rotina do motorista.
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
                      Cotar agora
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.cta}>
          <div>
            <h2>Quer partir para a cotação?</h2>
            <p>
              Se você já entendeu o que precisa comparar, pode seguir para a página de Seguro Auto e pedir a sua
              cotação.
            </p>
          </div>

          <Link className={styles.button} href="/cotacao-seguro-auto">
            Abrir Seguro Auto
          </Link>
        </section>
      </div>
    </main>
  );
}
