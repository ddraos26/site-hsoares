import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { AdminPresenceCard } from '@/components/admin-presence-card';

const navGroups = [
  {
    label: 'Operação',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/admin',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 13h7V4H4zm0 7h7v-5H4zm9 0h7V11h-7zm0-18v7h7V2z" />
          </svg>
        )
      },
      {
        key: 'leads',
        label: 'Leads',
        href: '/admin/leads',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.015-8 4.5V21h16v-2.5c0-2.485-3.582-4.5-8-4.5Z" />
          </svg>
        )
      },
      {
        key: 'products',
        label: 'Produtos',
        href: '/admin/produtos',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Zm8-2.2L6.8 8.2 12 11l5.2-2.8L12 5.3Zm-6 4.4v5.6l5 2.8v-5.6l-5-2.8Zm7 8.4 5-2.8V9.7l-5 2.8v5.6Z" />
          </svg>
        )
      },
      {
        key: 'pages',
        label: 'Páginas',
        href: '/admin/paginas',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 3h14a2 2 0 0 1 2 2v14H3V5a2 2 0 0 1 2-2Zm0 2v2h14V5H5Zm0 4v8h14V9H5Zm2 2h6v2H7v-2Zm0 4h10v2H7v-2Z" />
          </svg>
        )
      },
      {
        key: 'campaigns',
        label: 'Campanhas',
        href: '/admin/campanhas',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 8h3l8-4v16l-8-4H4V8Zm12 1.618 3.447-1.724A2 2 0 0 1 22 9.683v4.634a2 2 0 0 1-2.553 1.789L16 14.382V9.618ZM6 10v4h2.528L14 16.736V7.264L8.528 10H6Zm1 8h3l1.2 3h-2.16L7 18Z" />
          </svg>
        )
      },
      {
        key: 'team',
        label: 'Equipe',
        href: '/admin/equipe',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm6 2a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM3 19c0-2.761 3.134-5 7-5 1.665 0 3.194.415 4.395 1.106A5.23 5.23 0 0 0 13 19v2H3v-2Zm12 2v-2c0-1.886 2.239-3.5 5-3.5s5 1.614 5 3.5v2h-10Z" />
          </svg>
        )
      },
      {
        key: 'agenda',
        label: 'Agenda',
        href: '/admin/agenda',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10ZM6 8h12V6H6v2Z" />
          </svg>
        )
      },
      {
        key: 'files',
        label: 'Arquivos',
        href: '/admin/arquivos',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 2h8l4 4v16H6V2Zm8 1.5V7h3.5L14 3.5ZM8 10v2h8v-2H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z" />
          </svg>
        )
      }
    ]
  },
  {
    label: 'Gestão',
    items: [
      {
        key: 'settings',
        label: 'Configurações',
        href: '/admin/configuracoes',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.36 7.36 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.13.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.41 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.8a.5.5 0 0 0 .49-.42l.36-2.54c.58-.22 1.13-.53 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
          </svg>
        )
      }
    ]
  },
  {
    label: 'Futuro SegurosX',
    items: [
      {
        key: 'clients',
        label: 'Clientes',
        href: '/admin/clientes',
        future: true,
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm6 2a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-1.336 0-2.531.276-3.49.756A7.98 7.98 0 0 0 9 14c-3.866 0-7 1.791-7 4v2h14v-2c0-.696-.182-1.361-.51-1.964A8.234 8.234 0 0 1 15 15Zm0 1.5c2.757 0 5 1.12 5 2.5V21h-5.5v-1c0-.722-.166-1.406-.463-2.029.302-.311.905-.471 1.963-.471Z" />
          </svg>
        )
      },
      {
        key: 'brokers',
        label: 'Imobiliárias',
        href: '/admin/imobiliarias',
        future: true,
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 21V7l9-4 9 4v14h-7v-6h-4v6H3Zm4-8h2v2H7v-2Zm0-4h2v2H7V9Zm8 4h2v2h-2v-2Zm0-4h2v2h-2V9Z" />
          </svg>
        )
      },
      {
        key: 'policies',
        label: 'Apólices',
        href: '/admin/apolices',
        future: true,
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5L14 3.5ZM8 11v2h8v-2H8Zm0 4v2h8v-2H8Zm0 4v2h6v-2H8Z" />
          </svg>
        )
      },
      {
        key: 'renewals',
        label: 'Renovações',
        href: '/admin/renovacoes',
        future: true,
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z" />
          </svg>
        )
      }
    ]
  }
];

export function AdminShell({ section = 'dashboard', title, description, children }) {
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <BrandLogo className="brand-logo brand-logo--admin" />
          <div>
            <p className="eyebrow">Painel interno</p>
            <h1>H Soares Admin</h1>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Navegação do admin">
          {navGroups.map((group) => (
            <div key={group.label} className="admin-sidebar-group">
              <p className="admin-sidebar-group-label">{group.label}</p>
              {group.items.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`admin-sidebar-link ${section === item.key ? 'is-active' : ''} ${item.future ? 'admin-sidebar-link--future' : ''}`}
                >
                  <span className="admin-sidebar-icon">{item.icon}</span>
                  <span className="admin-sidebar-label-copy">
                    {item.label}
                    {item.future ? <small>SegurosX</small> : null}
                  </span>
                </Link>
              ))}
            </div>
          ))}
          <a href="/" className="admin-sidebar-link admin-sidebar-link--external">
            <span className="admin-sidebar-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 3h7v7h-2V6.414l-8.293 8.293-1.414-1.414L17.586 5H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z" />
              </svg>
            </span>
            Ver site
          </a>
        </nav>

        <AdminPresenceCard />

        <form action="/api/admin/logout" method="post" className="admin-sidebar-logout">
          <button type="submit" className="btn btn-ghost">
            Sair do painel
          </button>
        </form>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-copy">
            <p className="eyebrow">Operação interna</p>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </section>
    </main>
  );
}
