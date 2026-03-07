export function getClientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    return fwd.split(',')[0].trim();
  }
  return 'unknown';
}

export function hasJsonContentType(request) {
  const contentType = String(request.headers.get('content-type') || '').toLowerCase();
  return contentType.includes('application/json');
}

export function getAllowedHostnames() {
  const defaults = ['hsoaresseguros.com.br', 'www.hsoaresseguros.com.br', 'localhost', '127.0.0.1'];
  const extra = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return new Set([...defaults, ...extra]);
}

export function isAllowedOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) {
    return true;
  }

  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    const allowed = getAllowedHostnames();
    if (hostname.endsWith('.vercel.app')) {
      return true;
    }
    return allowed.has(hostname);
  } catch {
    return false;
  }
}
