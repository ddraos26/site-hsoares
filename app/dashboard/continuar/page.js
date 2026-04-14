import { redirect } from 'next/navigation';
import { getAdminNextFocus } from '@/lib/admin/next-focus';

export const metadata = {
  title: 'Continuar Trabalho | Dashboard',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardContinuePage() {
  try {
    const nextFocus = await getAdminNextFocus({ basePath: '/dashboard' });
    redirect(nextFocus.href || '/dashboard/checklist');
  } catch (error) {
    console.error('dashboard continue fallback', error);
    redirect('/dashboard/checklist');
  }
}
