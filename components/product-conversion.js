'use client';

import { useMemo, useState } from 'react';

function getOrCreateSessionId() {
  const key = 'hs_session_id';
  const current = window.localStorage.getItem(key);
  if (current) return current;

  const newValue = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  window.localStorage.setItem(key, newValue);
  return newValue;
}

function getAttribution() {
  const url = new URL(window.location.href);
  return {
    utm_source: url.searchParams.get('utm_source') || '',
    utm_medium: url.searchParams.get('utm_medium') || '',
    utm_campaign: url.searchParams.get('utm_campaign') || ''
  };
}

function newClickId(slug) {
  return `${slug}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function ProductConversion({ product }) {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const destination = useMemo(() => product.portoUrl, [product.portoUrl]);

  async function trackAndRedirect(withLead) {
    if (busy) return;

    const clickId = newClickId(product.slug);
    const sessionId = getOrCreateSessionId();
    const attr = getAttribution();

    setBusy(true);
    setFeedback('Preparando sua contratação...');

    try {
      await fetch('/api/track/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'porto_click',
          pagePath: window.location.pathname,
          productSlug: product.slug,
          clickId,
          sessionId,
          ...attr,
          referrer: document.referrer || ''
        })
      });

      if (withLead && (nome || whatsapp)) {
        await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            whatsapp,
            productSlug: product.slug,
            pagePath: window.location.pathname,
            clickId,
            sessionId,
            ...attr,
            referrer: document.referrer || '',
            leadType: 'micro_capture'
          })
        });
      }

      const url = new URL(destination);
      url.searchParams.set('hs_click_id', clickId);
      if (attr.utm_source) url.searchParams.set('utm_source', attr.utm_source);
      if (attr.utm_medium) url.searchParams.set('utm_medium', attr.utm_medium);
      if (attr.utm_campaign) url.searchParams.set('utm_campaign', attr.utm_campaign);

      window.location.href = url.toString();
    } catch {
      setFeedback('Não foi possível redirecionar agora. Tente novamente em instantes.');
      setBusy(false);
    }
  }

  return (
    <section className="conversion-box">
      <h2>Contrate com apoio da H Soares</h2>
      <p>
        Se quiser, deixe nome e WhatsApp para acompanhamento comercial. Se preferir, você pode seguir direto para o
        link oficial de contratação.
      </p>

      <div className="micro-form">
        <input
          type="text"
          placeholder="Seu nome (opcional)"
          value={nome}
          maxLength={120}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          type="text"
          placeholder="WhatsApp (opcional)"
          value={whatsapp}
          maxLength={20}
          onChange={(e) => setWhatsapp(e.target.value)}
        />
      </div>

      <div className="cta-row">
        <button onClick={() => trackAndRedirect(true)} disabled={busy} className="btn btn-primary">
          Ir para contratação
        </button>
        <button onClick={() => trackAndRedirect(false)} disabled={busy} className="btn btn-ghost">
          Continuar sem preencher
        </button>
      </div>

      {feedback && <p className="feedback">{feedback}</p>}
    </section>
  );
}
