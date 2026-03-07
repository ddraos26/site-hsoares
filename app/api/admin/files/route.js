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
    const product = sanitize(searchParams.get('product'));
    const queryLike = query ? `%${query}%` : null;

    const rows = await sql`
      SELECT
        la.id,
        la.lead_id,
        la.file_name,
        la.content_type,
        la.file_size_bytes,
        la.created_at,
        l.nome,
        l.whatsapp,
        l.email,
        l.product_slug,
        l.lead_status
      FROM lead_attachments la
      INNER JOIN leads l ON l.id = la.lead_id
      WHERE la.created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        AND (${product || null}::text IS NULL OR l.product_slug = ${product || null})
        AND (
          ${queryLike}::text IS NULL
          OR la.file_name ILIKE ${queryLike}
          OR COALESCE(l.nome, '') ILIKE ${queryLike}
          OR COALESCE(l.email, '') ILIKE ${queryLike}
          OR COALESCE(l.whatsapp, '') ILIKE ${queryLike}
          OR COALESCE(l.product_slug, '') ILIKE ${queryLike}
        )
      ORDER BY la.created_at DESC
      LIMIT 500
    `;

    const [summaryRow] = await sql`
      SELECT
        COUNT(*)::int AS total_files,
        COALESCE(SUM(file_size_bytes), 0)::bigint AS total_size_bytes,
        COUNT(DISTINCT lead_id)::int AS leads_with_files,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS files_today
      FROM lead_attachments
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
    `;

    return NextResponse.json({
      summary: {
        totalFiles: summaryRow?.total_files || 0,
        totalSizeBytes: Number(summaryRow?.total_size_bytes || 0),
        leadsWithFiles: summaryRow?.leads_with_files || 0,
        filesToday: summaryRow?.files_today || 0
      },
      items: rows.map((row) => ({
        id: row.id,
        leadId: row.lead_id,
        name: row.file_name,
        contentType: row.content_type,
        sizeBytes: row.file_size_bytes,
        createdAt: row.created_at,
        leadName: row.nome,
        leadWhatsapp: row.whatsapp,
        leadEmail: row.email,
        productSlug: row.product_slug,
        leadStatus: row.lead_status,
        url: `/api/admin/leads/${row.lead_id}/attachments/${row.id}`
      }))
    });
  } catch (error) {
    console.error('admin files error', error);
    return NextResponse.json({ error: 'Falha ao carregar arquivos.' }, { status: 500 });
  }
}
