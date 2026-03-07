import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function sanitize(value, limit = 160) {
  return String(value || '').trim().slice(0, limit);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
    const product = searchParams.get('product');
    const query = sanitize(searchParams.get('q'));

    const sql = getDb();
    const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
    const queryLike = query ? `%${query}%` : null;

    const leads = await sql`
      SELECT
        id,
        nome,
        whatsapp,
        email,
        product_slug,
        page_path,
        click_id,
        notes,
        lead_status,
        created_at
      FROM leads
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        AND (${status || null}::text IS NULL OR lead_status = ${status || null})
        AND (${product || null}::text IS NULL OR product_slug = ${product || null})
        AND (
          ${queryLike}::text IS NULL
          OR nome ILIKE ${queryLike}
          OR whatsapp ILIKE ${queryLike}
          OR email ILIKE ${queryLike}
          OR product_slug ILIKE ${queryLike}
          OR page_path ILIKE ${queryLike}
        )
      ORDER BY created_at DESC
      LIMIT 500
    `;

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('leads error', error);
    return NextResponse.json({ error: 'Falha ao listar leads.' }, { status: 500 });
  }
}
