import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { DailyChecklistSummary } from '@/components/admin/daily-checklist-panel';
import { AdminPresenceCard } from '@/components/admin-presence-card';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';

const navGroups = [
  {
    label: 'Operação do dia',
    description: 'Fluxo único para tocar páginas, produtos e tarefas em ordem.',
    defaultOpen: true,
    items: [
      {
        key: 'today',
        label: 'Hoje',
        href: '/admin/missao-hoje',
        sections: ['today', 'dashboard', 'mission'],
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 13h7V4H4zm0 7h7v-5H4zm9 0h7V11h-7zm0-18v7h7V2z" />
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
        key: 'queue',
        label: 'Fazer Agora',
        href: '/admin/tasks',
        sections: ['queue', 'tasks'],
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6h11v2H9V6Zm0 5h11v2H9v-2Zm0 5h11v2H9v-2ZM4.5 7.5 3 6l-1 1 2.5 2.5L8 6 7 5 4.5 7.5Zm0 5L3 11l-1 1 2.5 2.5L8 11l-1-1-2.5 2.5Zm0 5L3 16l-1 1 2.5 2.5L8 16l-1-1-2.5 2.5Z" />
          </svg>
        )
      },
      {
        key: 'in-progress',
        label: 'Executando',
        href: '/dashboard/in-progress',
        sections: ['in-progress'],
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M11 2v4h2V2h-2Zm6.364 2.222-1.414 1.414A8 8 0 1 1 4.222 17.364l1.414-1.414A6 6 0 1 0 17.364 4.222ZM11 7h2v6h-5v-2h3V7Z" />
          </svg>
        )
      },
      {
        key: 'completed',
        label: 'Feitos',
        href: '/admin/historico',
        sections: ['completed', 'history'],
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13 3a9 9 0 1 1-8.485 12H2l3.5-3.5L9 15H6.564A7 7 0 1 0 13 5V3Zm-1 4h2v6h-5v-2h3V7Z" />
          </svg>
        )
      },
      {
        key: 'radar',
        label: 'Radar',
        href: '/dashboard/radar',
        sections: ['radar'],
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3a9 9 0 1 1-9 9h2a7 7 0 1 0 7-7V3Zm0 4a5 5 0 1 1-5 5h2a3 3 0 1 0 3-3V7Zm0 3a2 2 0 1 1-2 2h2v-2Z" />
          </svg>
        )
      }
    ]
  },
  {
    label: 'IA guiada',
    description: 'Recomendações, decisões e ciclos de aprovação.',
    defaultOpen: true,
    items: [
      {
        key: 'insights',
        label: 'IA / Insights',
        href: '/admin/insights',
        sections: ['insights', 'mission', 'ai'],
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a6 6 0 0 1 6 6c0 1.93-.915 3.646-2.333 4.744A6.004 6.004 0 0 1 13 22h-2a6.004 6.004 0 0 1-2.667-9.256A5.977 5.977 0 0 1 6 8a6 6 0 0 1 6-6Zm-1 15v2h2v-2h-2Zm-1.8-2h5.6c-.579-.588-1.27-1.107-2.042-1.485l-.758-.37-.758.37A6.633 6.633 0 0 0 9.2 15Z" />
          </svg>
        )
      },
      {
        key: 'copilot',
        label: 'Centro de Decisão',
        href: '/admin/copiloto',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a7 7 0 0 0-7 7v3.268A2 2 0 0 0 4 14v4a2 2 0 0 0 2 2h3.1a4.002 4.002 0 0 0 5.8 0H18a2 2 0 0 0 2-2v-4a2 2 0 0 0-1-1.732V9a7 7 0 0 0-7-7Zm-5 7a5 5 0 1 1 10 0v3H7V9Zm1 5h8v4h-1.354l-.3.52a2 2 0 0 1-3.466 0l-.3-.52H8v-4Zm-2 0v4h1v-4H6Zm12 0v4h1v-4h-1Z" />
          </svg>
        )
      },
      {
        key: 'approvals',
        label: 'Decisões',
        href: '/admin/aprovacoes',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4l4 3 4-3h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm-1 10h-3.586l-1.707 1.28a1 1 0 0 1-1.414 0L10.586 16H7V8h12Z" />
          </svg>
        )
      }
    ]
  },
  {
    label: 'Campanhas & análises',
    description: 'Onde monitoramos tráfego, SEO e resultados.',
    defaultOpen: false,
    items: [
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
        key: 'seo',
        label: 'SEO',
        href: '/admin/seo',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.5 3a7.5 7.5 0 0 1 5.93 12.094l4.238 4.238-1.414 1.414-4.238-4.238A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
          </svg>
        )
      },
      {
        key: 'analytics',
        label: 'Analytics',
        href: '/admin/analytics',
        sections: ['analytics'],
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 19h16v2H2V3h2v16Zm3-2V9h3v8H7Zm5 0V5h3v12h-3Zm5 0v-6h3v6h-3Z" />
          </svg>
        )
      }
    ]
  },
  {
    label: 'Apoio operacional',
    description: 'Tarefas, automações e arquivos extras.',
    defaultOpen: false,
    items: [
      {
        key: 'automations',
        label: 'Automações',
        href: '/admin/automacoes',
        sections: ['automations'],
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2 4 6v6c0 5.25 3.438 9.944 8 11 4.562-1.056 8-5.75 8-11V6l-8-4Zm3 6-4 8H9l4-8h2Zm-4.5 9.5h3v2h-3v-2Z" />
          </svg>
        )
      },
      {
        key: 'results',
        label: 'Resultados',
        href: '/dashboard/results',
        sections: ['results'],
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 19h18v2H3v-2Zm1-4 4-4 3 3 6-7 3 2-9 10-3-3-2 2-2-3Z" />
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
        key: 'files',
        label: 'Arquivos',
        href: '/admin/arquivos',
        sections: ['files'],
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 2h8l4 4v16H6V2Zm8 1.5V7h3.5L14 3.5ZM8 10v2h8v-2H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z" />
          </svg>
        )
      },
      {
        key: 'settings',
        label: 'Configurações',
        href: '/admin/configuracoes',
        sections: ['settings', 'rules', 'ai-cost', 'agenda', 'team'],
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.36 7.36 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.13.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.41 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.8a.5.5 0 0 0 .49-.42l.36-2.54c.58-.22 1.13-.53 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
          </svg>
        )
      }
    ]
  }
];

function isItemActive(item, section) {
  return item.key === section || (Array.isArray(item.sections) && item.sections.includes(section));
}

export function AdminShell({ section = 'dashboard', title, description, children, basePath = '/admin' }) {
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
            <details
              key={group.label}
              className="admin-sidebar-group"
              open={group.defaultOpen || group.items.some((item) => isItemActive(item, section))}
            >
              <summary className="admin-sidebar-group-summary">
                <div className="admin-sidebar-group-copy">
                  <p className="admin-sidebar-group-label">{group.label}</p>
                  {group.description ? <small>{group.description}</small> : null}
                </div>
                <span className="admin-sidebar-group-caret" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="m7 10 5 5 5-5H7Z" />
                  </svg>
                </span>
              </summary>
              <div className="admin-sidebar-group-items">
                {group.items.map((item) => (
                  <Link
                    key={item.key}
                    href={resolveDashboardHref(item.href, basePath)}
                    className={`admin-sidebar-link ${isItemActive(item, section) ? 'is-active' : ''} ${item.future ? 'admin-sidebar-link--future' : ''}`}
                  >
                    <span className="admin-sidebar-icon">{item.icon}</span>
                    <span className="admin-sidebar-label-copy">{item.label}</span>
                  </Link>
                ))}
              </div>
            </details>
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
          <DailyChecklistSummary basePath={basePath} />
        </header>

        <div className="admin-content">{children}</div>
      </section>
    </main>
  );
}
