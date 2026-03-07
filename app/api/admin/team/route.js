import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function sanitize(value, limit = 160) {
  return String(value || '').trim().slice(0, limit);
}

function resolveRange(searchParams) {
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return { fromDate, toDate };
}

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const { fromDate, toDate } = resolveRange(searchParams);
    const query = sanitize(searchParams.get('q'));
    const queryLike = query ? `%${query}%` : null;

    const rows = await sql`
      SELECT
        COALESCE(NULLIF(TRIM(owner_name), ''), 'Sem responsável') AS owner_name,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE lead_status = 'novo')::int AS novos,
        COUNT(*) FILTER (WHERE lead_status = 'em_contato')::int AS em_contato,
        COUNT(*) FILTER (WHERE lead_status = 'ganho')::int AS ganhos,
        COUNT(*) FILTER (WHERE lead_status = 'perdido')::int AS perdidos,
        COUNT(*) FILTER (
          WHERE lead_status IN ('novo', 'em_contato')
            AND next_contact_at IS NOT NULL
            AND next_contact_at <= now()
        )::int AS overdue,
        MAX(updated_at) AS last_update_at
      FROM leads
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        AND (
          ${queryLike}::text IS NULL
          OR COALESCE(owner_name, 'Sem responsável') ILIKE ${queryLike}
        )
      GROUP BY 1
      ORDER BY ganhos DESC, total DESC, owner_name ASC
    `;

    const items = rows.map((row) => {
      const totalPipeline = (row.novos || 0) + (row.em_contato || 0) + (row.ganhos || 0) + (row.perdidos || 0);
      return {
        ownerName: row.owner_name,
        total: row.total || 0,
        novos: row.novos || 0,
        emContato: row.em_contato || 0,
        ganhos: row.ganhos || 0,
        perdidos: row.perdidos || 0,
        overdue: row.overdue || 0,
        lastUpdateAt: row.last_update_at || null,
        winRate: totalPipeline ? Number((((row.ganhos || 0) / totalPipeline) * 100).toFixed(2)) : 0
      };
    });

    const summary = {
      totalOwners: items.length,
      assignedOwners: items.filter((item) => item.ownerName !== 'Sem responsável').length,
      unassignedLeads: items.find((item) => item.ownerName === 'Sem responsável')?.total || 0,
      overdue: items.reduce((sum, item) => sum + item.overdue, 0),
      ganhos: items.reduce((sum, item) => sum + item.ganhos, 0)
    };

    return NextResponse.json({ summary, items });
  } catch (error) {
    console.error('admin team error', error);
    return NextResponse.json({ error: 'Falha ao carregar equipe.' }, { status: 500 });
  }
}
