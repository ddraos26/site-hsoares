import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');

let loaded = false;

export async function loadLocalEnv() {
  if (loaded) return;
  loadEnvConfig(process.cwd());
  loaded = true;
}
