import 'server-only';

import { promises as fs } from 'fs';
import path from 'path';

const ADMIN_LOG_DIR = path.join(process.cwd(), 'logs', 'admin-intelligence');

async function ensureAdminLogDir() {
  await fs.mkdir(ADMIN_LOG_DIR, { recursive: true });
}

export function resolveAdminLogPath(fileName) {
  return path.join(ADMIN_LOG_DIR, fileName);
}

export async function readJsonlFile(fileName) {
  const filePath = resolveAdminLogPath(fileName);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
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
    if (error?.code !== 'ENOENT') {
      console.error('admin file log read error', error);
    }
    return [];
  }
}

export async function appendJsonlFile(fileName, payload) {
  const filePath = resolveAdminLogPath(fileName);

  try {
    await ensureAdminLogDir();
    await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`);
    return true;
  } catch (error) {
    console.error('admin file log append error', error);
    return false;
  }
}
