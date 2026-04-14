'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { TrackedExternalLink } from '@/components/tracked-external-link';
import { siteConfig } from '@/lib/site';

function matchesTargetPath(pathname, targetPaths = ['*']) {
  const normalizedPath = String(pathname || '/').trim() || '/';
  const normalizedTargets = Array.isArray(targetPaths) ? targetPaths : [targetPaths];

  return normalizedTargets.some((item) => {
    const target = String(item || '').trim();
    if (!target || target === '*') return true;
    if (target === normalizedPath) return true;
    return normalizedPath.startsWith(`${target}/`);
  });
}

function buildWhatsAppHref(message = '') {
  const phone = String(siteConfig.phone || '').replace(/\D/g, '');
  const normalizedPhone = phone.startsWith('55') ? phone : `55${phone}`;
  const encodedMessage = encodeURIComponent(String(message || '').trim() || 'Olá, vim pelo site da H Soares Seguros.');
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

function createProofRibbon(proof) {
  const shell = document.createElement('div');
  shell.className = 'site-proof-ribbon';

  const eyebrow = document.createElement('span');
  eyebrow.textContent = proof.eyebrow || 'Por que agir agora';
  shell.appendChild(eyebrow);

  const title = document.createElement('strong');
  title.textContent = proof.title || 'Atendimento humano com leitura clara e apoio rápido no WhatsApp.';
  shell.appendChild(title);

  const list = document.createElement('ul');
  for (const item of proof.items || []) {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  }
  shell.appendChild(list);

  return shell;
}

export function SiteAutomationLayer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState(null);
  const previewToken = searchParams?.get('site_patch_preview') || '';

  useEffect(() => {
    let active = true;
    const query = previewToken ? `?preview=${encodeURIComponent(previewToken)}` : '';

    fetch(`/api/site-automation${query}`, {
      cache: 'no-store'
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        if (payload?.ok) {
          setState(payload.state || null);
        }
      })
      .catch(() => {
        if (active) setState(null);
      });

    return () => {
      active = false;
    };
  }, [previewToken]);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
      return undefined;
    }

    const cleanup = [];
    const heroHeading = document.querySelector('main h1');
    const heroSubhead = document.querySelector('main .subhead');
    const heroCtaRow = document.querySelector('main .cta-row');
    const headerWhatsapp = document.querySelector('.site-header .btn-whatsapp');
    const footerWhatsapp = document.querySelector('.site-footer .footer-cta');

    const boost = state?.heroCtaBoost;
    if (boost?.enabled && matchesTargetPath(pathname, boost.targetPaths) && heroCtaRow) {
      heroCtaRow.classList.add('site-hero-cta-boosted');
      cleanup.push(() => heroCtaRow.classList.remove('site-hero-cta-boosted'));
    }

    const headline = state?.headlineVariant;
    if (headline?.enabled && matchesTargetPath(pathname, headline.targetPaths)) {
      if (heroHeading && headline.headline) {
        const original = heroHeading.textContent || '';
        heroHeading.textContent = headline.headline;
        heroHeading.classList.add('site-hero-headline-variant');
        cleanup.push(() => {
          heroHeading.textContent = original;
          heroHeading.classList.remove('site-hero-headline-variant');
        });
      }

      if (heroSubhead && headline.subheadline) {
        const original = heroSubhead.textContent || '';
        heroSubhead.textContent = headline.subheadline;
        heroSubhead.classList.add('site-hero-subhead-variant');
        cleanup.push(() => {
          heroSubhead.textContent = original;
          heroSubhead.classList.remove('site-hero-subhead-variant');
        });
      }
    }

    const proof = state?.socialProofRibbon;
    if (proof?.enabled && matchesTargetPath(pathname, proof.targetPaths) && heroCtaRow?.parentElement) {
      const ribbon = createProofRibbon(proof);
      heroCtaRow.insertAdjacentElement('afterend', ribbon);
      cleanup.push(() => ribbon.remove());
    }

    const seo = state?.seoMetaOverride;
    if (seo?.enabled && matchesTargetPath(pathname, seo.targetPaths)) {
      const originalTitle = document.title;
      if (seo.title) {
        document.title = seo.title;
      }

      let meta = document.querySelector('meta[name="description"]');
      let createdMeta = false;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
        createdMeta = true;
      }
      const originalDescription = meta.getAttribute('content') || '';
      if (seo.description) {
        meta.setAttribute('content', seo.description);
      }

      cleanup.push(() => {
        document.title = originalTitle;
        if (createdMeta) {
          meta.remove();
        } else {
          meta.setAttribute('content', originalDescription);
        }
      });
    }

    const headerBoost = state?.headerWhatsappBoost;
    if (headerBoost?.enabled && matchesTargetPath(pathname, headerBoost.targetPaths) && headerWhatsapp) {
      const originalText = headerWhatsapp.textContent || '';
      headerWhatsapp.classList.add('site-header-whatsapp-boosted');
      if (headerBoost.label) {
        headerWhatsapp.textContent = headerBoost.label;
      }

      cleanup.push(() => {
        headerWhatsapp.textContent = originalText;
        headerWhatsapp.classList.remove('site-header-whatsapp-boosted');
      });
    }

    const footerBoost = state?.footerWhatsappBoost;
    if (footerBoost?.enabled && matchesTargetPath(pathname, footerBoost.targetPaths) && footerWhatsapp) {
      const originalText = footerWhatsapp.textContent || '';
      footerWhatsapp.classList.add('site-footer-whatsapp-boosted');
      if (footerBoost.label) {
        footerWhatsapp.textContent = footerBoost.label;
      }

      cleanup.push(() => {
        footerWhatsapp.textContent = originalText;
        footerWhatsapp.classList.remove('site-footer-whatsapp-boosted');
      });
    }

    return () => {
      for (const action of cleanup.reverse()) {
        action();
      }
    };
  }, [pathname, state]);

  if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
    return null;
  }

  const floating = state?.floatingWhatsappCta || null;
  const sticky = state?.stickyMobileBar || null;
  const showFloating = Boolean(floating?.enabled) && matchesTargetPath(pathname, floating?.targetPaths);
  const showSticky = Boolean(sticky?.enabled) && matchesTargetPath(pathname, sticky?.targetPaths);

  if (!showFloating && !showSticky) return null;

  return (
    <>
      {showFloating ? (
        <TrackedExternalLink
          href={buildWhatsAppHref(floating.message)}
          target="_blank"
          rel="noopener noreferrer"
          className="site-floating-cta"
          eventType="whatsapp_click"
          payload={{
            placement: 'site-automation-floating',
            note: floating.note || ''
          }}
        >
          <span>Atendimento rápido</span>
          <strong>{floating.label || 'Falar no WhatsApp'}</strong>
        </TrackedExternalLink>
      ) : null}

      {showSticky ? (
        <TrackedExternalLink
          href={buildWhatsAppHref(sticky.message)}
          target="_blank"
          rel="noopener noreferrer"
          className="site-sticky-mobile-cta"
          eventType="whatsapp_click"
          payload={{
            placement: 'site-automation-sticky',
            note: sticky.note || ''
          }}
        >
          <span>WhatsApp</span>
          <strong>{sticky.label || 'Atendimento no WhatsApp'}</strong>
        </TrackedExternalLink>
      ) : null}
    </>
  );
}
