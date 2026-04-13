import Link from 'next/link';
import styles from '../blog.module.css';
import { getArticlesByCategory } from '../articles';
import { absoluteUrl, buildPageMetadata } from '../../../lib/site';

export const metadata = buildPageMetadata({
  title: 'Blog Fiança e Imobiliário: locação sem fiador, coberturas e garantia',
  description:
    'Guias sobre Seguro Fiança, locação sem fiador, coberturas do aluguel e pontos do contrato para inquilino, proprietário e imobiliária.',
  path: '/blog/fianca-e-imobiliario',
  image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
});

const roadmap = [
  {
    title: 'Locação sem fiador pede leitura clara da garantia',
    text: 'Seguro Fiança faz sentido quando você quer velocidade, previsibilidade e menos atrito na aprovação da locação.'
  },
  {
    title: 'Coberturas mudam bastante a proteção do contrato',
    text: 'Aluguel, encargos, danos ao imóvel e demais coberturas precisam ser entendidos em conjunto para evitar surpresa depois.'
  },
  {
    title: 'A melhor decisão é a que reduz ruído para todos',
    text: 'Quando a garantia está bem explicada, inquilino, proprietário e imobiliária avançam com mais segurança.'
  }
];

export default function BlogFiancaImobiliarioPage() {
  const articles = getArticlesByCategory('fianca-e-imobiliario');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Categoria Fiança e Imobiliário do Blog H Soares Seguros',
    description:
      'Guias sobre Seguro Fiança, locação sem fiador, coberturas do aluguel e garantia para inquilino, proprietário e imobiliária.',
    url: absoluteUrl('/blog/fianca-e-imobiliario'),
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
              <p className={styles.eyebrow}>Guia de Fiança e Locação</p>
                <h1 className={styles.sectionTitle}>Fiança e imobiliário com linguagem clara para locação sem confusão</h1>
                <p className={styles.sectionSubtitle}>
                  Aqui você encontra conteúdo sobre Seguro Fiança, locação sem fiador, coberturas do aluguel e
                  pontos que costumam gerar dúvida para inquilino, proprietário e imobiliária.
              </p>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.pillDark}>Fiança e imobiliário</span>
              <span className={styles.pillDark}>2 leituras publicadas</span>
              <span className={styles.pillDark}>Locação sem ruído</span>
            </div>

            <div className={styles.heroActions}>
              <Link className={styles.buttonGhost} href="/blog">
                Voltar para home do blog
              </Link>
              <Link className={styles.button} href="/seguro-fianca-locaticia">
                Ir para Seguro Fiança
              </Link>
            </div>

            <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                <strong>Já publicado</strong>
                <span>Sem fiador, leitura das coberturas e clareza para a locação já entraram em pauta.</span>
              </div>
              <div className={styles.heroStat}>
                <strong>Leitura mais clara</strong>
                <span>O foco é ajudar você a entender a locação sem juridiquês e sem confusão desnecessária.</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Temas principais</p>
            <h2>Os assuntos que mais pesam na rotina da locação</h2>
            <p>
              Esta categoria foca nas perguntas que mais travam a locação e a conversa entre inquilino,
              proprietário e imobiliária.
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
            <h2>Os primeiros artigos de locação já estão no ar</h2>
            <p>
              Começamos pelos temas que mais destravam a jornada: quando o Seguro Fiança faz sentido no lugar do
              fiador e como ler aluguel, encargos e danos ao imóvel com mais clareza.
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
                      Avançar na locação
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.cta}>
          <div>
            <h2>Quer seguir agora para a próxima etapa?</h2>
            <p>
              Se você quer avaliar o Seguro Fiança para a sua locação, a página principal já está pronta para
              continuar a jornada.
            </p>
          </div>

          <Link className={styles.button} href="/seguro-fianca-locaticia">
            Abrir Seguro Fiança
          </Link>
        </section>
      </div>
    </main>
  );
}
