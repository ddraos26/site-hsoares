import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();
    const activeWindowMinutes = 3;
    const since = new Date(Date.now() - activeWindowMinutes * 60 * 1000).toISOString();

    const [onlineRow] = await sql`
      WITH active_sessions AS (
        SELECT session_id
        FROM page_views
        WHERE session_id IS NOT NULL
          AND created_at >= ${since}
        UNION
        SELECT session_id
        FROM conversion_events
        WHERE session_id IS NOT NULL
          AND event_type = 'heartbeat'
          AND created_at >= ${since}
      )
      SELECT COUNT(DISTINCT session_id)::int AS total
      FROM active_sessions
    `;

    const [lastSeenRow] = await sql`
      WITH last_activity AS (
        SELECT MAX(created_at) AS last_seen
        FROM (
          SELECT created_at
          FROM page_views
          WHERE created_at >= ${since}
          UNION ALL
          SELECT created_at
          FROM conversion_events
          WHERE event_type = 'heartbeat'
            AND created_at >= ${since}
        ) events
      )
      SELECT last_seen
      FROM last_activity
    `;

    return NextResponse.json({
      onlineUsers: onlineRow?.total || 0,
      activeWindowMinutes,
      lastSeenAt: lastSeenRow?.last_seen || null
    });
  } catch (error) {
    console.error('presence error', error);
    return NextResponse.json({ error: 'Falha ao carregar presença online.' }, { status: 500 });
  }
}
