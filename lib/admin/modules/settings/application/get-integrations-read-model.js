import 'server-only';

import { getAdminIntegrationSnapshot } from '@/lib/admin/integration-status';

export async function getIntegrationsReadModel() {
  return getAdminIntegrationSnapshot();
}
