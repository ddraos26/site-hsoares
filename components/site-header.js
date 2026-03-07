import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="top-strip">Atendimento comercial: WhatsApp (11) 9 7206-4288 | 30 anos de mercado</div>
      <div className="container nav-shell">
        <Link href="/" className="brand" aria-label="H Soares Seguros">
          <BrandLogo className="brand-logo" />
        </Link>

        <nav className="nav-links">
          <Link href="/">Início</Link>
          <Link href="/#produtos">Produtos</Link>
          <Link href="/seguradoras">Seguradoras</Link>
          <Link href="/institucional">Institucional</Link>
          <Link href="/contato">Contato</Link>
        </nav>

        <div className="nav-actions">
          <Link
            href="/login"
            className="admin-icon-btn"
            aria-label="Acesso do administrador"
            title="Acesso do administrador"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.14 0-7.5 2.69-7.5 6a.75.75 0 0 0 1.5 0c0-2.4 2.69-4.5 6-4.5s6 2.1 6 4.5a.75.75 0 0 0 1.5 0c0-3.31-3.36-6-7.5-6Z"
                fill="currentColor"
              />
            </svg>
            <span>Admin</span>
          </Link>

          <a
            href="https://wa.me/5511972064288?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20H%20Soares%20Seguros"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
