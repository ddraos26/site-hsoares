import Image from 'next/image';
import Link from 'next/link';
import { TrackedPortoLink } from '@/components/tracked-porto-link';
import styles from './blog.module.css';
import { blogCategories, cardUpdates } from './data';
import { getArticleBySlug } from './articles';
import { absoluteUrl, buildPageMetadata } from '../../lib/site';

export const metadata = buildPageMetadata({
  title: 'Blog H Soares Seguros: Cartão Porto, Seguro Celular, Auto, Saúde e Fiança',
  description:
    'Guias premium para comparar Cartão Porto, Seguro Celular, Seguro Auto, Plano de Saúde e Seguro Fiança com mais clareza antes de contratar.',
  path: '/blog',
  image: '/assets/blog/porto-hero-option-2-crop.jpeg'
});

function ArticleVisual({ item, compact = false, scenic = false }) {
  const toneClass = styles[`visual${item.visual.tone}`] || styles.visualblue;
  const image = scenic && item.homeHeroImage ? item.homeHeroImage : item.cardCoverImage || item.heroImage;
  const useCoverLayout = compact || scenic;
  const coverStyle = {
    backgroundImage: `url(${image.url})`,
    backgroundSize: image.size || (scenic ? '80%' : 'cover'),
    backgroundPosition: image.position || (scenic ? 'right 18px bottom 14px' : 'center'),
    backgroundRepeat: 'no-repeat'
  };

  if (useCoverLayout) {
    return (
      <div
        className={`${styles.visualCard} ${toneClass} ${compact ? styles.visualCompact : ''} ${
          scenic ? styles.visualScenic : ''
        } ${scenic ? styles.visualHeroCover : styles.visualCompactCover}`}
      >
        <div className={styles.visualCoverMedia} style={coverStyle} aria-hidden="true" />
        <div className={scenic ? styles.visualHeroShade : styles.visualCoverShade} aria-hidden="true" />

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

  return (
    <div
      className={`${styles.visualCard} ${toneClass} ${compact ? styles.visualCompact : ''} ${
        scenic ? styles.visualScenic : ''
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

      <div className={`${styles.visualImageWrap} ${scenic ? styles.visualImageWrapScenic : ''}`}>
        <img
          className={`${styles.visualImage} ${scenic ? styles.visualImageCover : ''}`}
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

function ActionLink({ item, className, children }) {
  const href = item.actionHref || item.contractUrl;

  if (!href) {
    return null;
  }

  if (item.actionExternal || item.contractUrl) {
    return (
      <TrackedPortoLink
        className={className}
        href={href}
        target="_blank"
        rel="noreferrer"
        ctaPosition="card_cta"
        pageSection="blog_content"
        templateType="blog_category"
        articleSlug={item.slug}
        categorySlug={item.category}
      >
        {children}
      </TrackedPortoLink>
    );
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export default function BlogHomePage() {
  const featured = getArticleBySlug('cartao-portoseguro-beneficios') || cardUpdates[0];
  const phoneFeatured = getArticleBySlug('seguro-celular-vale-a-pena-2026');
  const phoneFeaturedSecond = getArticleBySlug('quanto-custa-seguro-de-celular-2026');
  const portoHighlight = {
    ...featured,
    cardCoverImage: {
      url: '/assets/blog/porto-hero-option-2-crop.jpeg',
      alt: 'Cartões Porto em composição premium',
      size: '122%',
      position: '70% 48%'
    }
  };
  const highlights = [portoHighlight, phoneFeatured, phoneFeaturedSecond].filter(Boolean);
  const heroArtwork = {
    url: '/assets/blog/porto-hero-transparent-trimmed.png',
    alt: 'Dois cartões Porto em destaque'
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog H Soares Seguros',
    description: 'Guias sobre Cartão Porto, Seguro Celular e outras categorias do blog da H Soares Seguros.',
    url: 'https://hsoaresseguros.com.br/blog'
  };
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Destaques do blog H Soares Seguros',
    itemListElement: highlights.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.pageTitle || item.title,
      url: absoluteUrl(`/blog/noticia/${item.slug}`)
    }))
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, itemListSchema]) }} />

      <div className={styles.stack}>
        <section className={styles.hero}>
          <div className={styles.heroSplit}>
            <div className={styles.heroMain}>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Blog H Soares Seguros</p>
                <h1 className={styles.sectionTitle}>
                  Guias para escolher Cartão Porto, Seguro Celular, Auto, Saúde e Fiança com mais clareza
                </h1>
                <p className={styles.sectionSubtitle}>
                  Se a sua dúvida é escolher um cartão que entregue valor no uso real, proteger um celular caro ou
                  entender coberturas antes da contratação, aqui você encontra leituras objetivas para decidir com
                  mais segurança.
                </p>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.pillDark}>Guias atualizados</span>
                <span className={styles.pillDark}>Cobertura, custo e benefícios</span>
                <span className={styles.pillDark}>Leitura direta para decidir melhor</span>
              </div>

              <div className={styles.heroActions}>
                <Link className={styles.button} href="/blog/cartoes">
                  Ver artigos de Cartões
                </Link>
                <Link className={styles.buttonGhost} href="/blog/seguro-celular">
                  Ver artigos de Seguro Celular
                </Link>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <strong>Cartão Porto em destaque</strong>
                  <span>Veja quando pontos, descontos, Tag Porto e anuidade realmente compensam no dia a dia.</span>
                </div>
                <div className={styles.heroStat}>
                  <strong>Seguro Celular em foco</strong>
                  <span>Entenda cobertura para roubo, danos, aparelho usado, vigência e parcelamento antes de cotar.</span>
                </div>
              </div>
            </div>

            <aside className={styles.heroAside}>
              <div className={styles.heroArtwork}>
                <img className={styles.heroArtworkImage} src={heroArtwork.url} alt={heroArtwork.alt} loading="eager" />
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Temas do blog</p>
            <h2>Escolha a categoria pela sua dúvida principal</h2>
            <p>
              Se hoje a decisão passa por cartão, celular, auto, saúde ou locação, comece pela categoria que responde
              à sua pergunta mais urgente. Cada área reúne comparativos, guias e atalhos para deixar a escolha menos
              cansativa.
            </p>
          </header>

          <div className={styles.categoryGrid}>
            {blogCategories.map((category) => (
              <article
                key={category.slug}
                className={`${styles.categoryCard} ${
                  category.tone ? styles[`categoryCard${category.tone}`] || '' : ''
                }`}
              >
                <div className={styles.categoryHead}>
                  <span className={category.statusTone === 'live' ? styles.categoryStatusLive : styles.categoryStatusMuted}>
                    {category.status}
                  </span>
                  <span className={styles.categoryCount}>{category.countLabel}</span>
                </div>

                <div className={styles.categoryMedia}>
                  <span className={styles.categoryMediaBadge}>{category.imageEyebrow}</span>
                  <div
                    className={styles.categoryMediaFrame}
                    style={{
                      '--category-image': `url(${category.image})`,
                      '--category-size': category.imageSize || 'cover',
                      '--category-position': category.imagePosition || 'center'
                    }}
                    aria-label={category.imageAlt}
                  >
                    <div className={styles.categoryMediaCopy}>
                      <h3>{category.title}</h3>
                      <p>{category.description}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.categoryFoot}>
                  <span className={styles.categoryAccent}>{category.accent}</span>
                  <Link className={styles.buttonGhostDark} href={category.href}>
                    Ver artigos
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.highlight}>
          <div className={styles.highlightBody}>
            <div className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Seguro Celular em alta</p>
              <h2>Seguro Celular Porto para quem quer proteger o aparelho com mais clareza</h2>
              <p>
                Se o aparelho concentra banco, trabalho, autenticação e vida pessoal, proteger o celular deixa de ser
                detalhe. Aqui você encontra cobertura, elegibilidade, vigência e custo explicados de forma simples.
              </p>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.pill}>Seguro Celular</span>
              <span className={styles.pill}>Celular novo ou usado</span>
              <span className={styles.pill}>Cobertura e vigência</span>
            </div>

            <div className={styles.buttonRow}>
              <Link className={styles.buttonGhostDark} href="/blog/seguro-celular">
                Ver artigos de Seguro Celular
              </Link>
              <Link className={styles.buttonGhostDark} href="/blog/noticia/seguro-celular-vale-a-pena-2026">
                Ler guia principal
              </Link>
            </div>
          </div>

          <aside className={styles.highlightCard}>
            <h3>O que você descobre nessa categoria</h3>
            <ul>
              <li>Quais coberturas entram em cada cenário, do roubo ao plano mais completo.</li>
              <li>Como funciona a vigência anual e quando a proteção começa a valer.</li>
              <li>Se o aparelho usado pode entrar e quais regras precisam ser respeitadas.</li>
              <li>Como olhar parcelamento e custo sem perder de vista a cobertura.</li>
            </ul>
          </aside>
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Leituras em destaque</p>
            <h2>Três guias para comparar antes de avançar</h2>
            <p>
              Se você quer decidir sem abrir dezenas de abas, comece por estes conteúdos. Eles reúnem os pontos que
              mais costumam pesar na escolha entre Cartão Porto e Seguro Celular.
            </p>
          </header>

          <div className={styles.featureStrip}>
            {highlights.map((item, index) => (
              <article
                key={item.slug}
                className={`${styles.featureCard} ${
                  index === 0 ? styles.featureCardPrimary : ''
                } ${
                  item.category === 'cartoes'
                    ? styles.featureCardblue
                    : item.category === 'seguro-celular'
                      ? styles.featureCardindigo
                      : ''
                }`}
              >
                <ArticleVisual item={item} compact />
                <div className={styles.featureBody}>
                  <span className={styles.pill}>{item.readTime}</span>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                </div>
                <div className={styles.buttonRow}>
                  <Link className={styles.buttonLink} href={`/blog/noticia/${item.slug}`}>
                    Ler artigo
                  </Link>
                  <ActionLink item={item} className={styles.buttonMini}>
                    {item.actionLabel || (item.contractUrl ? 'Contratar Cartão Porto' : 'Contratar')}
                  </ActionLink>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.cta}>
          <div>
            <h2>Escolha o assunto que combina com a sua dúvida de hoje</h2>
            <p>
              Se a sua decisão está entre cartão e proteção para o celular, você já pode seguir direto para a categoria
              certa e continuar a leitura com mais contexto.
            </p>
          </div>

          <div className={styles.buttonRow}>
            <Link className={styles.button} href="/blog/cartoes">
              Ver Cartão Porto
            </Link>
            <Link className={styles.buttonGhost} href="/blog/seguro-celular">
              Ver Seguro Celular
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
