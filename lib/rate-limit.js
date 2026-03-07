const store = new Map();

export function rateLimit({ key, limit = 20, windowMs = 60_000 }) {
  const now = Date.now();
  const value = store.get(key);

  if (!value || now - value.start >= windowMs) {
    store.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: limit - 1 };
  }

  value.count += 1;
  store.set(key, value);

  return {
    allowed: value.count <= limit,
    remaining: Math.max(limit - value.count, 0)
  };
}
