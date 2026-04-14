function toBase64Url(value) {
  const text = String(value || '');
  const base64 =
    typeof window === 'undefined'
      ? Buffer.from(text, 'utf-8').toString('base64')
      : window.btoa(unescape(encodeURIComponent(text)));

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = String(value || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  if (typeof window === 'undefined') {
    return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf-8');
  }

  return decodeURIComponent(escape(window.atob(`${normalized}${padding}`)));
}

export function encodePageDetailId(pagePath) {
  return toBase64Url(pagePath);
}

export function decodePageDetailId(value) {
  try {
    return fromBase64Url(value);
  } catch {
    return '';
  }
}
