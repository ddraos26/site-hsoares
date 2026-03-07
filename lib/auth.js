import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'hs_admin_session';

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET não configurada.');
  }
  return new TextEncoder().encode(secret);
}

export async function verifyAdminCredentials(email, password) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '');
  const adminHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();

  if (!adminEmail || (!adminPassword && !adminHash)) {
    throw new Error('ADMIN_EMAIL/ADMIN_PASSWORD ou ADMIN_PASSWORD_HASH não configurados.');
  }

  if (email.trim().toLowerCase() !== adminEmail) {
    return false;
  }

  if (adminPassword) {
    return password === adminPassword;
  }

  return bcrypt.compare(password, adminHash);
}

export async function createAdminToken(email) {
  return new SignJWT({ role: 'admin', email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(getSecret());
}

export async function verifyAdminToken(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}
