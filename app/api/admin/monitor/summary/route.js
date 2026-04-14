import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const LOG_FILE = path.join(process.cwd(), 'logs', 'dashboard-alerts.log');

async function readLogEntries() {
  try {
    const content = await fs.readFile(LOG_FILE, 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('monitor summary read error', error);
    }
    return [];
  }
}

function countWithin(entries, windowMs) {
  const now = Date.now();
  return entries.filter((entry) => {
    const timestamp = Date.parse(entry.timestamp || '');
    return Number.isFinite(timestamp) && now - timestamp <= windowMs;
  }).length;
}

export async function GET() {
  const entries = await readLogEntries();
  const totalAlerts = entries.length;
  const last24h = countWithin(entries, 24 * 60 * 60 * 1000);
  const lastHour = countWithin(entries, 60 * 60 * 1000);
  const uniqueFilters = new Set(entries.map((entry) => JSON.stringify(entry.filters || {}))).size;
  const lastAlert = entries.length ? entries.at(-1)?.alerts?.[0] || null : null;

  return NextResponse.json({
    totalAlerts,
    last24h,
    lastHour,
    uniqueFilters,
    lastAlert
  });
}
