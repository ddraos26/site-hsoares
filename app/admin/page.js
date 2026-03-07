import Link from 'next/link';
import DashboardClient from './dashboard-client';

export const metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return (
    <main className="admin-page">
      <div className="admin-header">
        <h1>Painel Admin - H Soares</h1>
        <div className="admin-actions">
          <Link href="/admin/leads" className="btn btn-primary">
            Ver Leads
          </Link>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="btn btn-ghost">
              Sair
            </button>
          </form>
        </div>
      </div>

      <DashboardClient />
    </main>
  );
}
