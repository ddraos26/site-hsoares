'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SafeImage } from '@/components/safe-image';

export function ServicesCarousel({ title, subtitle, items = [] }) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(items.length > 0);
  const [activePage, setActivePage] = useState(0);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(items.length / 4)), [items.length]);

  const updateState = () => {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    setCanPrev(scrollLeft > 8);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 8);

    const page = Math.round(scrollLeft / Math.max(clientWidth, 1));
    setActivePage(Math.min(Math.max(page, 0), pageCount - 1));
  };

  useEffect(() => {
    updateState();
    const track = trackRef.current;
    if (!track) return;

    track.addEventListener('scroll', updateState, { passive: true });
    window.addEventListener('resize', updateState);

    return () => {
      track.removeEventListener('scroll', updateState);
      window.removeEventListener('resize', updateState);
    };
  }, [pageCount]);

  const scroll = (direction) => {
    const track = trackRef.current;
    if (!track) return;

    const amount = track.clientWidth * direction;
    track.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="services-carousel">
      <div className="services-carousel-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="services-carousel-shell">
        <button
          type="button"
          className="carousel-arrow"
          onClick={() => scroll(-1)}
          disabled={!canPrev}
          aria-label="Voltar"
        >
          &#10094;
        </button>

        <div className="services-track" ref={trackRef}>
          {items.map((item) => (
            <article key={item.title} className="service-card">
              <figure>
                <SafeImage src={item.image} alt={item.title} />
              </figure>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="carousel-arrow"
          onClick={() => scroll(1)}
          disabled={!canNext}
          aria-label="Avançar"
        >
          &#10095;
        </button>
      </div>

      <div className="carousel-dots" aria-hidden="true">
        {Array.from({ length: pageCount }).map((_, index) => (
          <span key={`dot-${index}`} className={index === activePage ? 'is-active' : ''} />
        ))}
      </div>
    </section>
  );
}
