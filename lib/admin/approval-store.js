import 'server-only';

import { getDb } from '@/lib/db';
import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';
import { readJsonlFile } from '@/lib/admin/file-log-store';

const APPROVAL_LOG_FILE = 'approvals.jsonl';

function normalizeDecision(entry) {
  return {
    id: entry.id || entry.approval_key,
    status: entry.status || 'pending',
    actor: entry.actor || 'admin',
    rationale: entry.rationale || '',
    title: entry.title || '',
    createdAt: entry.createdAt || entry.created_at || new Date().toISOString()
  };
}

function dedupeDecisions(entries = []) {
  const seen = new Set();

  return entries.filter((entry) => {
    const key = `${entry.id}:${entry.status}:${entry.createdAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function readApprovalDecisions() {
  await ensureAdminOpsTables();

  const sql = getDb();
  const [dbRows, legacyRows] = await Promise.all([
    sql`
      SELECT approval_key, title, status, actor, rationale, created_at
      FROM approval_decisions
      ORDER BY created_at ASC
    `,
    readJsonlFile(APPROVAL_LOG_FILE)
  ]);

  return dedupeDecisions([...legacyRows, ...dbRows].map(normalizeDecision)).sort(
    (left, right) => Date.parse(left.createdAt || 0) - Date.parse(right.createdAt || 0)
  );
}

export async function recordApprovalDecision({ id, status, actor, rationale, title }) {
  await ensureAdminOpsTables();

  const payload = normalizeDecision({
    id,
    status,
    actor,
    rationale,
    title,
    createdAt: new Date().toISOString()
  });

  const sql = getDb();

  await sql`
    INSERT INTO approval_decisions (
      approval_key,
      title,
      status,
      actor,
      rationale,
      created_at
    )
    VALUES (
      ${payload.id},
      ${payload.title || 'Aprovação'},
      ${payload.status},
      ${payload.actor},
      ${payload.rationale || null},
      ${payload.createdAt}
    )
  `;

  return payload;
}

export function mergeApprovalState(items = [], decisions = []) {
  const latestMap = new Map();

  for (const decision of decisions) {
    latestMap.set(decision.id, decision);
  }

  const pending = [];
  const history = [];

  for (const item of items) {
    const latest = latestMap.get(item.id);
    const merged = {
      ...item,
      status: latest?.status || 'pending',
      decidedAt: latest?.createdAt || null,
      decidedBy: latest?.actor || null,
      rationale: latest?.rationale || ''
    };

    if (merged.status === 'pending') {
      pending.push(merged);
    } else {
      history.push(merged);
    }
  }

  history.sort((a, b) => Date.parse(b.decidedAt || '') - Date.parse(a.decidedAt || ''));

  return { pending, history };
}
