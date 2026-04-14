import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters'
];

let cachedClient;
let cachedCredentials;

function parseGoogleServiceAccountCredentials() {
  if (cachedCredentials) {
    return cachedCredentials;
  }

  let rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não configurado');
  }

  if (typeof rawKey === 'string') {
    rawKey = rawKey.trim();
    if ((rawKey.startsWith("'") && rawKey.endsWith("'")) || (rawKey.startsWith('"') && rawKey.endsWith('"'))) {
      rawKey = rawKey.slice(1, -1);
    }
  }

  cachedCredentials = typeof rawKey === 'string' ? JSON.parse(rawKey) : rawKey;
  return cachedCredentials;
}

export function getGoogleAuthClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const credentials = parseGoogleServiceAccountCredentials();
  const jwtClient = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES
  });

  cachedClient = jwtClient;
  return cachedClient;
}

export function getGoogleServiceAccountEmail() {
  const credentials = parseGoogleServiceAccountCredentials();
  return credentials.client_email;
}
