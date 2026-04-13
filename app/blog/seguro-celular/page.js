import Link from 'next/link';
import styles from '../blog.module.css';
import { getArticlesByCategory } from '../articles';
import { absoluteUrl, buildPageMetadata } from '../../../lib/site';

export const metadata = buildPageMetadata({
  title: 'Blog Seguro Celular: cobertura, iPhone, roubo, furto e custo',
  description:
    'Guias sobre Seguro Celular com foco em cobertura, roubo, furto, iPhone, AppleCare, aparelho usado, vigência, preço e momento certo para contratar.',
  path: '/blog/seguro-celular',
  image: '/assets/blog/ip.png'
});

const roadmap = [
  {
    title: 'Seguro de celular vale a pena em 2026?',
    text: 'Comece pelo guia principal para entender quando a proteção realmente compensa e como comparar custo e risco.'
  },
  {
    title: 'Seguro cobre roubo e furto? O que realmente muda?',
    text: 'Esse guia master explica a diferença entre roubo, furto mediante arrombamento, furto simples e o que costuma ficar fora da cobertura.'
  },
  {
    title: 'Quanto custa um seguro de celular e quando compensa?',
    text: 'Esse guia organiza faixas de bolso, explica por que não existe tabela única e mostra quando a mensalidade realmente faz sentido.'
  }
];

export default function BlogSeguroCelularPage() {
  const articles = getArticlesByCategory('seguro-celular');
  const articleCountLabel = `${articles.length} leituras publicadas`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Categoria Seguro Celular do Blog H Soares Seguros',
    description:
      'Guias sobre Seguro Celular com foco em cobertura, iPhone, roubo, furto, AppleCare, custo e vigência.',
    url: absoluteUrl('/blog/seguro-celular'),
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
          <div className={styles.heroSplit}>
            <div className={styles.heroMain}>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Guia de Seguro Celular</p>
                <h1 className={styles.sectionTitle}>Seguro Celular: veja quando vale a pena e como escolher com mais clareza</h1>
                <p className={styles.sectionSubtitle}>
                  Aqui você encontra guias para comparar cobertura, risco, aparelho usado, vigência, pagamento e o que
                  realmente pesa antes de contratar o Seguro Celular Porto.
                </p>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.pillDark}>Seguro Celular</span>
                <span className={styles.pillDark}>{articleCountLabel}</span>
                <span className={styles.pillDark}>iPhone e smartphone premium</span>
              </div>

              <div className={styles.heroActions}>
                <Link className={styles.buttonGhost} href="/blog">
                  Voltar para o blog
                </Link>
                <Link className={styles.button} href="/produtos/seguro-celular">
                  Cotar Seguro Celular
                </Link>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <strong>Guia principal</strong>
                  <span>Veja quando o seguro realmente compensa para iPhone e outros smartphones premium.</span>
                </div>
                <div className={styles.heroStat}>
                  <strong>Leitura mais clara</strong>
                  <span>Vale a pena, cobertura, aparelho usado, vigência e custo reunidos em uma trilha objetiva.</span>
                </div>
              </div>
            </div>

            <aside className={styles.heroAside}>
              <div className={`${styles.heroArtwork} ${styles.cellPhoneArtwork}`}>
                <img
                  className={`${styles.heroArtworkImage} ${styles.cellPhoneArtworkImage}`}
                  src="/assets/blog/ip.png"
                  alt="Linha de iPhones em destaque"
                  loading="eager"
                />
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.lightSection}>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Temas principais</p>
            <h2>Os assuntos que mais pesam na escolha do Seguro Celular</h2>
            <p>
              Esta categoria responde às dúvidas mais comuns de quem usa o celular como parte da rotina, do trabalho e
              da vida financeira.
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
            <h2>Guias para decidir com mais segurança</h2>
            <p>
              A categoria agora reúne guia geral, leitura sobre roubo e furto, preço, momento certo para contratar,
              comparativo com AppleCare, iPhone, cobertura, aparelho usado, vigência anual e formas de pagamento para
              ajudar você a comparar sem perder tempo.
            </p>
          </header>

          <div className={styles.newsGrid}>
            {articles.map((item) => {
              const cover = item.categoryCoverImage || item.cardCoverImage || item.heroImage;
              const coverStyle = {
                '--category-card-image': `url("${cover.url}")`,
                '--category-card-size': cover.size || 'cover',
                '--category-card-position': cover.position || 'center',
                '--category-card-background': cover.background || 'linear-gradient(135deg, #edf3ff 0%, #dce7f8 100%)'
              };

              return (
              <article key={item.slug} className={styles.newsCard}>
                <div className={styles.categoryMedia} style={coverStyle}>
                  <div className={styles.categoryMediaArt} role="img" aria-label={cover.alt} />
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
              );
            })}
          </div>
        </section>

        <section className={styles.cta}>
          <div>
            <h2>Quer ver o Seguro Celular em detalhes?</h2>
            <p>
              Se você já entendeu quando o seguro compensa e qual cobertura faz sentido, pode seguir para a página do
              Seguro Celular e continuar a cotação com mais segurança.
            </p>
          </div>

          <Link className={styles.button} href="/produtos/seguro-celular">
            Abrir Seguro Celular
          </Link>
        </section>
      </div>
    </main>
  );
}
