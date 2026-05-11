'use client';

import { useEffect, useState } from 'react';
import { ProductCtaButton } from '@/components/product-conversion';
import { SafeImage } from '@/components/safe-image';

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');

    const update = () => setPrefersReducedMotion(media.matches);

    update();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return prefersReducedMotion;
}

export function PortoCardHeroCarousel({ product, slides = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || paused || slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6800);

    return () => window.clearInterval(timer);
  }, [paused, prefersReducedMotion, slides.length]);

  if (!slides.length) {
    return null;
  }

  const goToSlide = (index) => {
    const nextIndex = (index + slides.length) % slides.length;
    setActiveIndex(nextIndex);
    setPaused(true);
  };

  return (
    <div
      className="porto-card-carousel porto-card-carousel--hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div
        className="porto-card-carousel__frame"
        role="region"
        aria-roledescription="carousel"
        aria-label="Destaques do Cartão Porto"
      >
        <div className="porto-card-carousel__viewport">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            const headingTag = index === 0 ? 'h1' : 'h2';
            const Heading = headingTag;
            const artworkItems = slide.artwork?.length
              ? slide.artwork
              : [
                  {
                    src: slide.image,
                    alt: slide.alt,
                    variant: 'primary'
                  }
                ];

            return (
              <article
                key={slide.title}
                className={`porto-card-carousel__slide${isActive ? ' is-active' : ''}${slide.tone ? ` porto-card-carousel__slide--${slide.tone}` : ''}`}
                aria-hidden={!isActive}
              >
                <div className="porto-card-carousel__backdrop" aria-hidden="true" />
                <div className="porto-card-carousel__content">
                  <div className="porto-card-carousel__copy">
                    <p className="porto-card-carousel__eyebrow">{slide.eyebrow || 'Cartão Porto'}</p>
                    <Heading>{slide.title}</Heading>
                    <p className="porto-card-carousel__subtitle">{slide.subtitle}</p>
                    <div className="cta-row porto-card-carousel__actions">
                      <ProductCtaButton
                        product={product}
                        label={slide.ctaLabel}
                        className="btn btn-primary porto-card-carousel__cta"
                        payload={slide.payload}
                      />
                    </div>
                    {slide.note ? <p className="porto-card-carousel__note">{slide.note}</p> : null}
                  </div>
                </div>

                <div
                  className={`porto-card-carousel__art${slide.artLayout ? ` porto-card-carousel__art--${slide.artLayout}` : ''}`}
                  aria-hidden="true"
                >
                  <div className={`porto-card-carousel__art-stage${slide.tone ? ` porto-card-carousel__art-stage--${slide.tone}` : ''}`}>
                    {artworkItems.map((item, artIndex) => (
                      <div
                        key={`${slide.title}-${item.src}-${artIndex}`}
                        className={`porto-card-carousel__art-card porto-card-carousel__art-card--${item.variant || (artIndex === 0 ? 'primary' : 'secondary')}${item.className ? ` ${item.className}` : ''}`}
                      >
                        <SafeImage
                          src={item.src}
                          alt={item.alt || ''}
                          loading={index === 0 && artIndex === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <button
          type="button"
          className="porto-card-carousel__arrow porto-card-carousel__arrow--prev"
          onClick={() => goToSlide(activeIndex - 1)}
          aria-label="Ver slide anterior"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <button
          type="button"
          className="porto-card-carousel__arrow porto-card-carousel__arrow--next"
          onClick={() => goToSlide(activeIndex + 1)}
          aria-label="Ver próximo slide"
        >
          <span aria-hidden="true">›</span>
        </button>

        <div className="porto-card-carousel__dots" role="tablist" aria-label="Selecionar slide">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={`porto-card-carousel__dot${index === activeIndex ? ' is-active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ver slide ${index + 1}: ${slide.title}`}
              aria-pressed={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
