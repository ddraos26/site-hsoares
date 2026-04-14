import 'server-only';

import { getExecutiveDashboardSnapshot } from '@/lib/admin/executive-dashboard';

export async function getExecutiveDashboardReadModel() {
  return getExecutiveDashboardSnapshot();
}
