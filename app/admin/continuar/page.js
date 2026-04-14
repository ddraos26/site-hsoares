import { redirect } from 'next/navigation';
import { getAdminNextFocus } from '@/lib/admin/next-focus';

export const metadata = {
  title: 'Continuar Trabalho | Admin',
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminContinuePage() {
  try {
    const nextFocus = await getAdminNextFocus({ basePath: '/admin' });
    redirect(nextFocus.href || '/admin/checklist');
  } catch (error) {
    console.error('admin continue fallback', error);
    redirect('/admin/checklist');
  }
}
