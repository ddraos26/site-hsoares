'use client';

import { useMemo, useState } from 'react';
import { trackPortoClick } from '@/lib/porto-tracking';
import { getBrowserAttribution, getOrCreateBrowserSessionId } from '@/lib/tracking-attribution';

function newClickId(slug) {
  return `${slug}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function redirectToProduct({
  product,
  destination,
  lead,
  payload = {},
  ctaLabel = ''
}) {
  const clickId = newClickId(product.slug);
  const sessionId = getOrCreateBrowserSessionId();
  const attr = getBrowserAttribution();
  const trackingPromise = trackPortoClick({
    href: destination,
    productSlug: product.slug,
    clickId,
    sessionId,
    attribution: attr,
    ctaLabel,
    trackingPayload: payload,
    waitForTracking: true
  });
  const pendingTasks = [trackingPromise];

  if (lead && (lead.nome || lead.whatsapp)) {
    pendingTasks.push(
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          nome: lead.nome || '',
          whatsapp: lead.whatsapp || '',
          productSlug: product.slug,
          pagePath: window.location.pathname,
          clickId,
          sessionId,
          ...attr,
          referrer: document.referrer || '',
          leadType: 'micro_capture'
        })
      }).catch(() => null)
    );
  }

  await Promise.all(pendingTasks);

  const url = new URL(destination, window.location.origin);
  url.searchParams.set('hs_click_id', clickId);
  if (attr.utm_source) url.searchParams.set('utm_source', attr.utm_source);
  if (attr.utm_medium) url.searchParams.set('utm_medium', attr.utm_medium);
  if (attr.utm_campaign) url.searchParams.set('utm_campaign', attr.utm_campaign);

  window.location.href = url.toString();
}

export function ProductCtaButton({
  product,
  label = 'Cotar agora',
  busyLabel = 'Abrindo...',
  className = 'btn btn-primary',
  payload = {}
}) {
  const [busy, setBusy] = useState(false);
  const destination = useMemo(() => product.portoUrl, [product.portoUrl]);

  async function handleClick() {
    if (busy) return;

    setBusy(true);

    try {
      await redirectToProduct({
        product,
        destination,
        payload,
        ctaLabel: label
      });
    } catch {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={busy} className={className}>
      {busy ? busyLabel : label}
    </button>
  );
}

export function ProductConversion({
  product,
  trackingPayload = {},
  primaryTrackingPayload = {},
  secondaryTrackingPayload = {}
}) {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const destination = useMemo(() => product.portoUrl, [product.portoUrl]);
  const primaryLabel = product.conversionPrimaryLabel || 'Ir para contratacao';
  const secondaryLabel = product.conversionSecondaryLabel || 'Continuar sem preencher';

  async function trackAndRedirect(withLead) {
    if (busy) return;

    setBusy(true);
    setFeedback('Preparando sua contratacao...');

    try {
      await redirectToProduct({
        product,
        destination,
        lead: withLead ? { nome, whatsapp } : null,
        ctaLabel: withLead ? primaryLabel : secondaryLabel,
        payload: {
          page_section: 'final_cta',
          cta_position: 'inline_cta',
          cta_placement: 'conversion-box',
          cta_mode: withLead ? 'micro-capture' : 'direct-continue',
          ...trackingPayload,
          ...(withLead ? primaryTrackingPayload : secondaryTrackingPayload)
        }
      });
    } catch {
      setFeedback('Nao foi possivel redirecionar agora. Tente novamente em instantes.');
      setBusy(false);
    }
  }

  return (
    <section className="conversion-box">
      <h2>{product.conversionTitle || 'Continue com apoio da H Soares'}</h2>
      <p>
        {product.conversionDescription ||
          'Se quiser, deixe nome e WhatsApp para receber orientacao antes de seguir. Se preferir, voce tambem pode ir direto para o link oficial de contratacao.'}
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
          {primaryLabel}
        </button>
        <button onClick={() => trackAndRedirect(false)} disabled={busy} className="btn btn-ghost">
          {secondaryLabel}
        </button>
      </div>

      {feedback && <p className="feedback">{feedback}</p>}
    </section>
  );
}
