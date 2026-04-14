import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'dashboard-alerts.log');
const WEBHOOK_URL = process.env.ADMIN_ALERTS_WEBHOOK_URL;

async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    console.error('monitor alerts mkdir error', error);
  }
}

async function appendLog(entry) {
  try {
    await ensureLogDir();
    await fs.appendFile(LOG_FILE, `${entry}\n`);
  } catch (error) {
    console.error('monitor alerts log error', error);
  }
}

async function sendWebhook(payload) {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `Alertas do dashboard: ${payload.alerts.join(' / ')}`,
        details: {
          filters: payload.filters || {},
          timestamp: payload.timestamp
        }
      })
    });
  } catch (error) {
    console.error('monitor alerts webhook error', error);
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const timestamp = new Date().toISOString();
    const serialized = JSON.stringify({
      timestamp,
      alerts: payload.alerts || [],
      filters: payload.filters || {}
    });
    await appendLog(serialized);
    await sendWebhook({ ...payload, timestamp });
    console.debug('monitor alert logged', serialized);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('monitor alerts error', error);
    return NextResponse.json({ error: 'Não foi possível registrar o alerta.' }, { status: 500 });
  }
}
