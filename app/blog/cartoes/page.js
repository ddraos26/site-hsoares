import Image from 'next/image';
import Link from 'next/link';
import { TrackedPortoLink } from '@/components/tracked-porto-link';
import styles from '../blog.module.css';
import { cardUpdates, topics } from '../data';
import { absoluteUrl, buildPageMetadata } from '../../../lib/site';

export const metadata = buildPageMetadata({
  title: 'Blog Cartão Porto: benefícios, anuidade, viagem e comparativos',
  description:
    'Artigos sobre Cartão Porto com foco em benefícios, anuidade, viagem, versões, comparativos e pedido com mais clareza antes da solicitação.',
  path: '/blog/cartoes',
  image: '/assets/blog/porto-hero-option-2-crop.jpeg'
});

function ArticleVisual({ item, compact = false }) {
  const toneClass = styles[`visual${item.visual.tone}`] || styles.visualblue;
  const image = compact ? item.cardCoverImage || item.heroImage : item.heroImage;

  return (
    <div
      className={`${styles.visualCard} ${toneClass} ${compact ? styles.visualCompact : ''} ${
        compact ? styles.visualPortoCompact : ''
      }`}
    >
      <div className={styles.visualTop}>
        <span className={styles.visualEyebrow}>{item.visual.eyebrow}</span>
        <div className={styles.visualLogoWrap}>
          <Image src={item.visual.logo} alt="Porto Seguro" width={124} height={28} className={styles.visualLogo} />
        </div>
      </div>

      <div className={styles.visualBody}>
        <strong>{item.visual.title}</strong>
        <p>{item.visual.subtitle}</p>
      </div>

      <div className={`${styles.visualImageWrap} ${compact ? styles.visualPortoCompactImageWrap : ''}`}>
        <img
          className={`${styles.visualImage} ${compact ? styles.visualPortoCompactImage : ''}`}
          src={image.url}
          alt={image.alt}
          loading="lazy"
        />
      </div>

      <div className={styles.visualChipRow}>
        {item.visual.chips.map((chip) => (
          <span key={chip} className={styles.visualChip}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroArtwork({ item }) {
  const image = item.cardCoverImage || item.heroImage;

  return (
    <div className={`${styles.heroArtwork} ${styles.cardHeroArtwork}`}>
      <img
        className={`${styles.heroArtworkImage} ${styles.cardHeroArtworkImage}`}
        src={image.url}
        alt={image.alt}
        loading="eager"
      />
    </div>
  );
}

export default function BlogCardsCategoryPage() {
  const featured = cardUpdates[0];
  const [comparison, travel] = cardUpdates.slice(1);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Categoria Cartões do Blog H Soares Seguros',
    description:
      'Artigos sobre Cartão Porto com foco em benefícios, anuidade, versões, viagem, comparativos e solicitação.',
    url: absoluteUrl('/blog/cartoes'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: cardUpdates.map((item, index) => ({
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
          <div className={styles.heroSplit}>
            <div className={styles.heroMain}>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Cartão Porto</p>
                <h1 className={styles.sectionTitle}>Cartão Porto: benefícios, anuidade, viagem e comparativos para escolher melhor</h1>
                <p className={styles.sectionSubtitle}>
                  Aqui você encontra os artigos que ajudam a entender quando o Cartão Porto vale a pena, qual versão
                  faz mais sentido para o seu perfil e como ele se compara com alternativas relevantes.
                </p>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.pillDark}>Benefícios e pontos</span>
                <span className={styles.pillDark}>Anuidade e versões</span>
                <span className={styles.pillDark}>Viagem e comparativos</span>
              </div>

              <div className={styles.heroActions}>
                <Link className={styles.buttonGhost} href="/blog">
                  Voltar para o blog
                </Link>
                <TrackedPortoLink
                  className={styles.button}
                  href={featured.contractUrl}
                  target="_blank"
                  rel="noreferrer"
                  ctaPosition="hero_primary"
                  pageSection="hero"
                  templateType="blog_category"
                  articleSlug={featured.slug}
                  categorySlug={featured.category}
                >
                  Contratar Cartão Porto
                </TrackedPortoLink>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <strong>Comparação com Nubank</strong>
                  <span>Veja em qual cenário a simplicidade pesa mais e quando os benefícios da Porto ganham valor real.</span>
                </div>
                <div className={styles.heroStat}>
                  <strong>Uso no dia a dia e em viagem</strong>
                  <span>Anuidade, salas VIP, IOF zero, pontos e categoria ideal explicados sem enrolação.</span>
                </div>
              </div>
            </div>

            <aside className={styles.heroAside}>
              <HeroArtwork item={featured} />
            </aside>
          </div>
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Principais temas</p>
            <h2>As perguntas que mais ajudam antes de pedir o Cartão Porto</h2>
            <p>
              Comece pelo tema que mais combina com a sua dúvida: comparativo, benefícios, viagem, anuidade ou passo a
              passo de solicitação. Assim, fica mais fácil escolher o próximo conteúdo sem perder tempo com informação
              genérica.
            </p>
          </header>

          <div className={styles.topicGrid}>
            {topics.map((topic) => (
              <article key={topic.title} className={styles.topicCard}>
                <h3>{topic.title}</h3>
                <p>{topic.summary}</p>
                <ul>
                  {topic.subtopics.map((subtopic) => (
                    <li key={subtopic}>{subtopic}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.highlight}>
          <div className={styles.highlightBody}>
            <div className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Por onde começar</p>
              <h2>Dois guias para quem ainda está comparando opções</h2>
              <p>
                Se você ainda está em dúvida, vale começar pelo comparativo com o Nubank ou pelo conteúdo sobre uso em
                viagem. São dois temas que costumam destravar a decisão mais rápido.
              </p>
            </div>

            <div className={styles.buttonRow}>
              <Link className={styles.buttonGhostDark} href={`/blog/noticia/${comparison.slug}`}>
                Comparar com Nubank
              </Link>
              <Link className={styles.buttonGhostDark} href={`/blog/noticia/${travel.slug}`}>
                Ver uso em viagem
              </Link>
            </div>
          </div>

          <aside className={styles.highlightCard}>
            <h3>O que você encontra nesta categoria</h3>
            <ul>
              <li>Benefícios do Cartão Porto e ecossistema da marca.</li>
              <li>Comparativos honestos com concorrentes relevantes.</li>
              <li>Leituras sobre anuidade, versão ideal e uso em viagem.</li>
              <li>Passo a passo para pedir o cartão com mais segurança.</li>
            </ul>
          </aside>
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Todos os artigos</p>
            <h2>Todos os artigos publicados sobre o Cartão Porto</h2>
            <p>
              Aqui estão reunidos os conteúdos para avaliar o Cartão Porto por diferentes ângulos: benefícios,
              anuidade, versões, viagem, renda, comparativos e solicitação.
            </p>
          </header>

          <div className={styles.newsGrid}>
            {cardUpdates.map((item) => (
              <article key={item.slug} className={styles.newsCard}>
                <ArticleVisual item={item} compact />

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
                    <TrackedPortoLink
                      className={styles.buttonMini}
                      href={item.contractUrl}
                      target="_blank"
                      rel="noreferrer"
                      ctaPosition="card_cta"
                      pageSection="blog_content"
                      templateType="blog_category"
                      articleSlug={item.slug}
                      categorySlug={item.category}
                    >
                      Pedir cartão
                    </TrackedPortoLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
