import 'server-only';

import { getAdminDecisionEngineSnapshot } from '@/lib/admin/decision-engine';

export async function getDecisionCenterReadModel() {
  return getAdminDecisionEngineSnapshot();
}
