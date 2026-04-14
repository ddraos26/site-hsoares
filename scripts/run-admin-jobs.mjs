import { loadLocalEnv } from './load-local-env.mjs';

await loadLocalEnv();

const { runAdminOpsJobCycle } = await import('../lib/admin/job-runner.js');

const result = await runAdminOpsJobCycle({
  triggerType: 'script',
  actor: 'script:admin-jobs'
});

console.log(JSON.stringify(result, null, 2));
