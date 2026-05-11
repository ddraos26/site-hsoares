'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ProductCtaButton } from '@/components/product-conversion';
import { SafeImage } from '@/components/safe-image';

function PortoCardDetailBlocks({ blocks = [] }) {
  return blocks.map((block, index) => {
    const key = `${block.type}-${index}-${block.text || block.title || 'item'}`;

    if (block.type === 'list') {
      return (
        <ul key={key} className="porto-card-detail-drawer-list">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    }

    if (block.type === 'note') {
      return (
        <p key={key} className="porto-card-detail-drawer-note">
          {block.text}
        </p>
      );
    }

    if (block.type === 'paragraph') {
      return (
        <p key={key} className={block.emphasis ? 'porto-card-detail-drawer-paragraph is-strong' : 'porto-card-detail-drawer-paragraph'}>
          {block.text}
        </p>
      );
    }

    return null;
  });
}

export function PortoCardVersionSection({ product, cards = [], note = '' }) {
  const [selectedVersionKey, setSelectedVersionKey] = useState(null);
  const titleId = useId();
  const subtitleId = useId();
  const closeButtonRef = useRef(null);
  const lastTriggerRef = useRef(null);

  const selectedCard = cards.find((card) => card.versionKey === selectedVersionKey) || null;
  const isDrawerOpen = Boolean(selectedCard);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSelectedVersionKey(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.requestAnimationFrame(() => {
        lastTriggerRef.current?.focus();
      });
    };
  }, [isDrawerOpen]);

  function openDrawer(versionKey, event) {
    lastTriggerRef.current = event.currentTarget;
    setSelectedVersionKey(versionKey);
  }

  function closeDrawer() {
    setSelectedVersionKey(null);
  }

  return (
    <>
      <div className="porto-card-version-grid">
        {cards.map((card) => (
          <article key={card.versionKey} className={`porto-card-version-card porto-card-version-card--${card.versionKey}`}>
            <div className={`porto-card-version-image porto-card-version-image--${card.versionKey}`}>
              <SafeImage src={card.image} alt={card.alt} />
            </div>

            <div className="porto-card-version-body">
              <h3>{card.title}</h3>
              <div className="porto-card-version-badge">{card.badge}</div>
              <div className="porto-card-version-divider" aria-hidden="true" />
              <div className="porto-card-version-benefits">
                {card.benefits.map((segments, index) => (
                  <p key={`${card.versionKey}-${index}`}>
                    {segments.map((segment, segmentIndex) =>
                      segment.emphasis ? (
                        <strong key={`${segment.text}-${segmentIndex}`}>{segment.text}</strong>
                      ) : (
                        <span key={`${segment.text}-${segmentIndex}`}>{segment.text}</span>
                      )
                    )}
                  </p>
                ))}
              </div>
            </div>

            <div className="porto-card-version-actions">
              <button
                type="button"
                className="porto-card-version-link"
                aria-haspopup="dialog"
                aria-expanded={selectedVersionKey === card.versionKey}
                onClick={(event) => openDrawer(card.versionKey, event)}
              >
                Ver detalhes
              </button>
            </div>
          </article>
        ))}
      </div>

      {note ? <p className="porto-card-version-note">{note}</p> : null}

      {selectedCard ? (
        <div className="porto-card-detail-drawer-shell" onClick={closeDrawer}>
          <div className="porto-card-detail-drawer-backdrop" />
          <aside
            className="porto-card-detail-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="porto-card-detail-drawer-top">
              <div>
                <h3 id={titleId}>{selectedCard.detail.drawerTitle}</h3>
                <p id={subtitleId} className="porto-card-detail-drawer-subtitle">
                  {selectedCard.detail.drawerSubtitle}
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                className="porto-card-detail-drawer-close"
                onClick={closeDrawer}
                aria-label={`Fechar detalhes de ${selectedCard.title}`}
              >
                ×
              </button>
            </div>

            <div className="porto-card-detail-drawer-body">
              {selectedCard.detail.intro?.length ? (
                <div className="porto-card-detail-drawer-intro">
                  {selectedCard.detail.intro.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              ) : null}

              {selectedCard.detail.sections.map((section) => (
                <section key={section.title} className="porto-card-detail-drawer-section">
                  <h4>{section.title}</h4>
                  <PortoCardDetailBlocks blocks={section.blocks} />
                </section>
              ))}
            </div>

            <div className="porto-card-detail-drawer-footer">
              <ProductCtaButton
                product={product}
                label="Peça o seu cartão"
                className="btn btn-primary porto-card-detail-drawer-cta"
                payload={{
                  cta_placement: 'version-drawer',
                  page_template: 'porto-card-dedicated',
                  version_key: selectedCard.versionKey
                }}
              />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
