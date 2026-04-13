import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TrackedPortoLink } from '@/components/tracked-porto-link';
import styles from '../../blog.module.css';
import { blogArticles, getArticleBySlug } from '../../articles';
import { absoluteUrl, buildPageMetadata, siteConfig } from '../../../../lib/site';

const categoryLabels = {
  cartoes: 'Cartões',
  'seguro-celular': 'Seguro Celular',
  'seguro-auto': 'Seguro Auto',
  'plano-saude': 'Plano de Saúde',
  'fianca-e-imobiliario': 'Fiança e Imobiliário'
};

const monthMap = {
  janeiro: '01',
  fevereiro: '02',
  marco: '03',
  abril: '04',
  maio: '05',
  junho: '06',
  julho: '07',
  agosto: '08',
  setembro: '09',
  outubro: '10',
  novembro: '11',
  dezembro: '12'
};

function getDisplayCategoryLabel(update) {
  return categoryLabels[update.category] || update.categoryTitle;
}

function getArticleImageUrl(update) {
  const image = update.cardCoverImage || update.heroImage;

  if (!image?.url) {
    return absoluteUrl(siteConfig.ogImage);
  }

  return image.url.startsWith('http') ? image.url : absoluteUrl(image.url);
}

function getArticleKeywords(update) {
  return Array.from(
    new Set([
      update.categoryTitle,
      getDisplayCategoryLabel(update),
      ...update.tags,
      update.title,
      update.pageTitle || update.title
    ])
  );
}

function formatBrazilianDateToIso(dateText) {
  if (!dateText) {
    return undefined;
  }

  const normalized = dateText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const match = normalized.match(/(\d{1,2}) de ([a-z]+) de (\d{4})/);

  if (!match) {
    return undefined;
  }

  const [, day, monthName, year] = match;
  const month = monthMap[monthName];

  if (!month) {
    return undefined;
  }

  return `${year}-${month}-${day.padStart(2, '0')}`;
}

function ArticleHeroArtwork({ item }) {
  const image = item.heroImage || item.cardCoverImage;
  const mediaUrl = image?.url || '';
  const isLocalArtwork =
    mediaUrl.startsWith('/assets/blog/') &&
    (mediaUrl.endsWith('.png') || mediaUrl.includes('trimmed') || mediaUrl.includes('transparent'));
  const useLargeArtwork = item.heroArtworkMode === 'artwork' || isLocalArtwork;
  const useCellPhoneArtwork = item.category === 'seguro-celular' && useLargeArtwork;

  if (useCellPhoneArtwork) {
    return (
      <div className={`${styles.heroArtwork} ${styles.cellPhoneArtwork} ${styles.articleCellPhoneArtwork}`}>
        <img
          className={`${styles.heroArtworkImage} ${styles.cellPhoneArtworkImage} ${styles.articleCellPhoneArtworkImage}`}
          src={image.url}
          alt={image.alt}
          loading="eager"
        />
      </div>
    );
  }

  if (useLargeArtwork) {
    return (
      <div className={`${styles.heroArtwork} ${styles.cardHeroArtwork} ${styles.articleCardHeroArtwork}`}>
        <img
          className={`${styles.heroArtworkImage} ${styles.cardHeroArtworkImage}`}
          src={image.url}
          alt={image.alt}
          loading="eager"
        />
      </div>
    );
  }

  return (
    <div className={`${styles.heroArtwork} ${styles.articleHeroScenicArtwork}`}>
      <img
        className={styles.articleHeroScenicImage}
        src={image.url}
        alt={image.alt}
        loading="eager"
        style={{ objectPosition: image.position || 'center' }}
      />
    </div>
  );
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const update = getArticleBySlug(resolvedParams.slug);

  if (!update) {
    return buildPageMetadata({
      title: 'Notícia não encontrada',
      description: 'O conteúdo solicitado não está disponível.',
      path: '/blog'
    });
  }

  return {
    ...buildPageMetadata({
      title: update.pageTitle || update.title,
      description: update.excerpt,
      path: `/blog/noticia/${update.slug}`,
      image: getArticleImageUrl(update),
      type: 'article'
    }),
    keywords: getArticleKeywords(update),
    category: getDisplayCategoryLabel(update),
    authors: [{ name: siteConfig.legalName }],
    creator: siteConfig.legalName,
    publisher: siteConfig.legalName,
    robots: {
      index: true,
      follow: true
    }
  };
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return blogArticles.map((item) => ({ slug: item.slug }));
}

export default async function BlogDetailPage({ params }) {
  const resolvedParams = await params;
  const update = getArticleBySlug(resolvedParams.slug);

  if (!update) {
    return notFound();
  }

  const ActionButton = ({ className, children, ctaPosition = 'section_middle', pageSection = 'blog_content' }) => {
    const actionHref = String(update.actionHref || '');
    const isExternalAction = /^https?:\/\//.test(actionHref);

    if (update.actionExternal || isExternalAction) {
      return (
        <TrackedPortoLink
          className={className}
          href={actionHref}
          target="_blank"
          rel="noreferrer"
          ctaPosition={ctaPosition}
          pageSection={pageSection}
          templateType="blog_article"
          articleSlug={update.slug}
          categorySlug={update.category}
        >
          {children}
        </TrackedPortoLink>
      );
    }

    return (
      <Link className={className} href={actionHref}>
        {children}
      </Link>
    );
  };

  const detailToneClass = styles[`detailTheme${update.visual.tone}`] || styles.detailThemeblue;
  const accentClasses = [styles.detailAccentBlue, styles.detailAccentTeal, styles.detailAccentGold];
  const ctaTags = update.tags.slice(0, 3);
  const heroTitle = update.pageTitle || update.title;
  const heroTitleLength = heroTitle.length;
  const isCellPhoneArticle = update.category === 'seguro-celular';
  const heroTitleSizeClass =
    heroTitleLength > 92
      ? styles.cardDetailHeroTitleTight
      : heroTitleLength > 76
        ? styles.cardDetailHeroTitleCompact
        : '';
  const displayCategoryLabel = getDisplayCategoryLabel(update);
  const heroMeta = [update.date, update.readTime, update.tags[0]].filter(Boolean);
  const heroHighlights = [
    {
      title: 'Leitura principal deste guia',
      text: update.visual.subtitle
    },
    {
      title: 'O que você vai encontrar aqui',
      text: update.excerpt
    }
  ];
  const articleUrl = absoluteUrl(`/blog/noticia/${update.slug}`);
  const articleImage = getArticleImageUrl(update);
  const articleDateIso = formatBrazilianDateToIso(update.date);
  const relatedArticles = blogArticles
    .filter((item) => item.slug !== update.slug && item.category === update.category)
    .map((item) => ({
      ...item,
      sharedTags: item.tags.filter((tag) => update.tags.includes(tag)).length
    }))
    .sort((a, b) => b.sharedTags - a.sharedTags)
    .slice(0, 3);

  const ArticleActionGroup = ({
    backLabel = `Mais artigos de ${displayCategoryLabel}`,
    ctaPosition = 'section_middle',
    pageSection = 'blog_content'
  }) => (
    <div className={styles.articleActionGroup}>
      <ActionButton className={styles.button} ctaPosition={ctaPosition} pageSection={pageSection}>
        {update.actionLabel}
      </ActionButton>
      <a className={styles.buttonWhatsApp} href={siteConfig.whatsapp} target="_blank" rel="noreferrer">
        Falar no WhatsApp
      </a>
      <Link className={styles.buttonGhost} href={update.categoryHref}>
        {backLabel}
      </Link>
    </div>
  );

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: update.pageTitle || update.title,
    description: update.excerpt,
    image: [articleImage],
    keywords: update.tags.join(', '),
    author: {
      '@type': 'Organization',
      name: 'H Soares Seguros'
    },
    publisher: {
      '@type': 'Organization',
      name: 'H Soares Seguros',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(siteConfig.logo)
      }
    },
    articleSection: displayCategoryLabel,
    isAccessibleForFree: true,
    mainEntityOfPage: articleUrl
  };
  const faqSchema =
    update.faq?.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: update.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer
            }
          }))
        }
      : null;
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Blog',
        item: absoluteUrl('/blog')
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: displayCategoryLabel,
        item: absoluteUrl(update.categoryHref)
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: update.pageTitle || update.title,
        item: articleUrl
      }
    ]
  };
  const structuredData = [articleSchema, breadcrumbSchema];

  if (articleDateIso) {
    articleSchema.datePublished = articleDateIso;
    articleSchema.dateModified = articleDateIso;
  }

  if (faqSchema) {
    structuredData.push(faqSchema);
  }

  return (
    <main className={`${styles.detailPage} ${detailToneClass}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className={styles.detailStack}>
        <section className={`${styles.detailHero} ${isCellPhoneArticle ? styles.articleCellPhoneDetailHero : ''}`}>
          <div className={styles.heroSplit}>
            <div
              className={`${styles.heroMain} ${styles.cardDetailHeroMain} ${
                isCellPhoneArticle ? styles.articleCellPhoneDetailHeroMain : ''
              }`}
            >
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Guia de {displayCategoryLabel}</p>
                <h1
                  className={`${styles.sectionTitle} ${styles.cardDetailHeroTitle} ${heroTitleSizeClass} ${
                    isCellPhoneArticle ? styles.articleCellPhoneDetailTitle : ''
                  }`}
                >
                  {heroTitle}
                </h1>
                <p
                  className={`${styles.sectionSubtitle} ${styles.cardDetailHeroLead} ${
                    isCellPhoneArticle ? styles.articleCellPhoneDetailLead : ''
                  }`}
                >
                  {update.overview}
                </p>
              </div>

              <div className={styles.metaRow}>
                {heroMeta.map((item) => (
                  <span key={item} className={styles.pillDark}>
                    {item}
                  </span>
                ))}
              </div>

              <div className={styles.heroActions}>
                <Link className={styles.buttonGhost} href={update.categoryHref}>
                  Voltar para {displayCategoryLabel}
                </Link>
                <ActionButton className={styles.button} ctaPosition="hero_primary" pageSection="hero">
                  {update.actionLabel}
                </ActionButton>
              </div>

              <div
                className={`${styles.heroStats} ${styles.cardDetailHeroStats} ${
                  isCellPhoneArticle ? styles.articleCellPhoneDetailHeroStats : ''
                }`}
              >
                {heroHighlights.map((item) => (
                  <div key={item.title} className={styles.heroStat}>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <aside className={styles.heroAside}>
              <ArticleHeroArtwork item={update} />
            </aside>
          </div>
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>O que você precisa saber</p>
            <h2>Os pontos que mais pesam antes de contratar</h2>
            <p>
              Reunimos abaixo os pontos que realmente fazem diferença na decisão, sem enrolação e sem promessa vaga.
            </p>
          </header>

          <div className={styles.detailGrid}>
            {update.blocks.map((block, index) => (
              <article key={block.title} className={`${styles.detailCard} ${accentClasses[index % accentClasses.length]}`}>
                <h3>{block.title}</h3>
                <p>{block.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.detailCtaBand}>
          <div className={styles.detailCtaCopy}>
            <span className={styles.detailCtaEyebrow}>Quando quiser seguir</span>
            <h2 className={styles.detailCtaTitle}>Quer avançar para a cotação com mais segurança?</h2>
            <p className={styles.detailCtaText}>
              Se este guia já esclareceu a principal dúvida, você pode seguir direto para a próxima etapa ou falar no
              WhatsApp para validar o melhor caminho antes de contratar.
            </p>

            <div className={styles.detailCtaBadges}>
              {ctaTags.map((tag) => (
                <span key={`mid-${tag}`} className={styles.detailCtaBadge}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <ArticleActionGroup ctaPosition="section_middle" pageSection="blog_content" />
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Leitura prática</p>
            <h2>Como avaliar se esta opção combina com a sua rotina</h2>
            <p>
              Esses pontos ajudam a sair da dúvida e entender se a proposta faz sentido para o seu bolso, seu uso e
              seu momento.
            </p>
          </header>

          <div className={styles.utilityGrid}>
            {update.utilityItems.map((item, index) => (
              <article key={item} className={`${styles.utilityCard} ${accentClasses[(index + 1) % accentClasses.length]}`}>
                <span className={styles.utilityIndex}>Ponto útil</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Perguntas frequentes</p>
            <h2>Respostas diretas para as dúvidas que mais aparecem</h2>
            <p>
              Antes de contratar, estas costumam ser as perguntas que mais influenciam a decisão final.
            </p>
          </header>

          <div className={styles.faqList}>
            {update.faq.map((item, index) => (
              <article key={item.question} className={`${styles.faqCard} ${accentClasses[(index + 2) % accentClasses.length]}`}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        {relatedArticles.length ? (
          <section className={styles.lightSection}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Continue a leitura</p>
              <h2>Outros artigos desta categoria que ajudam na decisão</h2>
              <p>
                Se você quiser aprofundar a comparação, estes guias complementam a leitura com outros ângulos do mesmo
                tema.
              </p>
            </header>

            <div className={styles.newsGrid}>
              {relatedArticles.map((item) => {
                const image = item.cardCoverImage || item.heroImage;

                return (
                  <article key={item.slug} className={styles.newsCard}>
                    <div className={styles.categoryMedia}>
                      <img
                        className={styles.categoryImage}
                        src={image.url}
                        alt={image.alt}
                        loading="lazy"
                        style={{ objectPosition: image.position || 'center' }}
                      />
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
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {update.sources?.length ? (
          <section className={styles.lightSection}>
            <header className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Fontes consultadas</p>
              <h2>Base oficial usada neste guia</h2>
              <p>
                Este conteúdo foi organizado com base em materiais oficiais e referências públicas para deixar a
                leitura mais segura e mais confiável.
              </p>
            </header>

            <div className={styles.faqList}>
              {update.sources.map((source, index) => (
                <article
                  key={source.url}
                  className={`${styles.faqCard} ${accentClasses[index % accentClasses.length]}`}
                >
                  <h3>{source.label}</h3>
                  <p>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      Abrir fonte oficial
                    </a>
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.cta}>
          <div>
            <h2>Pronto para seguir?</h2>
            <p>
              Se este conteúdo já ajudou na decisão, você pode continuar agora pela página do produto ou falar com a
              equipe para tirar uma dúvida rápida antes de avançar.
            </p>

            <div className={styles.detailCtaBadges}>
              {ctaTags.map((tag) => (
                <span key={`final-${tag}`} className={styles.detailCtaBadge}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <ArticleActionGroup ctaPosition="footer_cta" pageSection="final_cta" />
        </section>
      </div>
    </main>
  );
}
