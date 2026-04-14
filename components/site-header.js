'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/brand-logo';
import { TrackedExternalLink } from '@/components/tracked-external-link';

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/#produtos', label: 'Produtos' },
    { href: '/blog', label: 'Blog' },
    { href: '/seguradoras', label: 'Seguradoras' },
    { href: '/institucional', label: 'Institucional' },
    { href: '/contato', label: 'Contato' }
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    function handleResize() {
      if (window.innerWidth > 1040) {
        setMenuOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);

  const isActive = (href) => {
    if (href === '/blog') return pathname.startsWith('/blog');
    if (href === '/seguradoras') return pathname.startsWith('/seguradoras');
    if (href === '/institucional') return pathname.startsWith('/institucional');
    if (href === '/contato') return pathname.startsWith('/contato');
    if (href === '/#produtos') return pathname.startsWith('/produtos');
    return pathname === href;
  };

  return (
    <header className={`site-header ${menuOpen ? 'is-menu-open' : ''}`}>
      <div className="top-strip">Atendimento: WhatsApp (11) 9 7206-4288 | 30 anos de mercado</div>
      <div className="container nav-shell">
        <Link href="/" className="brand" aria-label="H Soares Seguros" onClick={() => setMenuOpen(false)}>
          <BrandLogo className="brand-logo" />
        </Link>

        <nav id="site-nav" className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive(item.href) ? 'is-active' : ''}`}
              aria-current={isActive(item.href) ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <TrackedExternalLink
            href="https://wa.me/5511972064288?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20H%20Soares%20Seguros"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
            eventType="whatsapp_click"
            payload={{ placement: 'header' }}
            onClick={() => setMenuOpen(false)}
          >
            WhatsApp
          </TrackedExternalLink>

          <button
            type="button"
            className={`nav-toggle ${menuOpen ? 'is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            aria-label={menuOpen ? 'Fechar menu principal' : 'Abrir menu principal'}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span className="nav-toggle-box" aria-hidden="true">
              <span />
            </span>
            <span className="nav-toggle-label">{menuOpen ? 'Fechar' : 'Menu'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
