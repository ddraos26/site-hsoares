import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function sanitize(value, limit = 120) {
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
    const product = sanitize(searchParams.get('product'));
    const owner = sanitize(searchParams.get('owner'));
    const productValue = product || null;
    const ownerLike = owner ? `%${owner}%` : null;

    const baseSelect = sql`
      SELECT
        id,
        nome,
        whatsapp,
        email,
        product_slug,
        lead_status,
        owner_name,
        next_contact_at,
        created_at,
        updated_at
      FROM leads
      WHERE created_at BETWEEN ${fromDate.toISOString()} AND ${toDate.toISOString()}
        AND (${productValue}::text IS NULL OR product_slug = ${productValue})
        AND (${ownerLike}::text IS NULL OR owner_name ILIKE ${ownerLike})
    `;

    const [overdue, today, upcoming, unassigned, staleNew] = await Promise.all([
      sql`${baseSelect} AND lead_status IN ('novo', 'em_contato') AND next_contact_at IS NOT NULL AND next_contact_at <= now() ORDER BY next_contact_at ASC LIMIT 20`,
      sql`${baseSelect} AND lead_status IN ('novo', 'em_contato') AND next_contact_at IS NOT NULL AND next_contact_at >= date_trunc('day', now()) AND next_contact_at < date_trunc('day', now()) + interval '1 day' ORDER BY next_contact_at ASC LIMIT 20`,
      sql`${baseSelect} AND lead_status IN ('novo', 'em_contato') AND next_contact_at IS NOT NULL AND next_contact_at >= now() AND next_contact_at < now() + interval '7 days' ORDER BY next_contact_at ASC LIMIT 30`,
      sql`${baseSelect} AND lead_status IN ('novo', 'em_contato') AND (owner_name IS NULL OR NULLIF(TRIM(owner_name), '') IS NULL) ORDER BY created_at DESC LIMIT 20`,
      sql`${baseSelect} AND lead_status = 'novo' AND updated_at <= now() - interval '12 hours' ORDER BY updated_at ASC LIMIT 20`
    ]);

    return NextResponse.json({
      summary: {
        overdue: overdue.length,
        today: today.length,
        upcoming: upcoming.length,
        unassigned: unassigned.length,
        staleNew: staleNew.length
      },
      overdue,
      today,
      upcoming,
      unassigned,
      staleNew
    });
  } catch (error) {
    console.error('admin agenda error', error);
    return NextResponse.json({ error: 'Falha ao carregar agenda.' }, { status: 500 });
  }
}
