'use client';

const DEFAULT_TTL_MS = 30_000;
const fetchCache = new Map();

function buildCacheKey(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = typeof options.body === 'string' ? options.body : '';
  return `${method}:${url}:${body}`;
}

export function primeAdminJsonCache(url, data, ttlMs = DEFAULT_TTL_MS, options = {}) {
  const key = buildCacheKey(url, options);
  fetchCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

export function invalidateAdminJsonCache(url, { method = 'GET' } = {}) {
  const prefix = `${String(method || 'GET').toUpperCase()}:${url}:`;

  for (const key of fetchCache.keys()) {
    if (key.startsWith(prefix)) {
      fetchCache.delete(key);
    }
  }
}

export async function fetchAdminJson(url, { ttlMs = DEFAULT_TTL_MS, fetchOptions } = {}) {
  const options = fetchOptions || {};
  const method = (options.method || 'GET').toUpperCase();
  const key = buildCacheKey(url, options);
  const now = Date.now();
  const cached = fetchCache.get(key);

  if (method === 'GET' && cached?.data && cached.expiresAt > now) {
    return cached.data;
  }

  if (method === 'GET' && cached?.promise && cached.expiresAt > now) {
    return cached.promise;
  }

  const request = fetch(url, options)
    .then((res) => res.json())
    .then((data) => {
      if (method === 'GET') {
        fetchCache.set(key, {
          data,
          expiresAt: Date.now() + ttlMs
        });
      }
      return data;
    })
    .catch((error) => {
      fetchCache.delete(key);
      throw error;
    });

  if (method === 'GET') {
    fetchCache.set(key, {
      promise: request,
      expiresAt: now + ttlMs
    });
  }

  return request;
}
