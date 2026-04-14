import 'server-only';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const aiUsagePolicy = {
  mode: 'balanced',
  dashboardLiveTtlMs: 60 * MINUTE,
  dashboardFallbackRetryMs: 10 * MINUTE,
  detailLiveTtlMs: 12 * HOUR,
  detailFallbackRetryMs: 45 * MINUTE
};

export function resolveDetailLiveTtlMs(priorityScore = 0) {
  const score = Number(priorityScore || 0);

  if (score >= 78) return 6 * HOUR;
  if (score >= 58) return 12 * HOUR;
  if (score >= 38) return 18 * HOUR;
  return 24 * HOUR;
}

function toTimestamp(value) {
  const timestamp = Date.parse(String(value || ''));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function readCacheAgeMs(updatedAt) {
  const timestamp = toTimestamp(updatedAt);
  if (!timestamp) return Number.POSITIVE_INFINITY;
  return Math.max(0, Date.now() - timestamp);
}

export function shouldReuseDashboardAiCache(cachedValue, { hasLiveProvider = false, signature } = {}) {
  if (!cachedValue?.narrative) return false;

  const sourceStatus = String(cachedValue.narrative?.source?.status || '');
  const isLive = sourceStatus === 'live';
  const ageMs = readCacheAgeMs(cachedValue.updatedAt);
  const sameSignature = cachedValue.signature === signature;

  if (!hasLiveProvider) {
    return sameSignature && ageMs < aiUsagePolicy.dashboardFallbackRetryMs;
  }

  if (isLive && ageMs < aiUsagePolicy.dashboardLiveTtlMs) {
    return true;
  }

  return sameSignature && ageMs < aiUsagePolicy.dashboardFallbackRetryMs;
}

export function shouldReuseDetailAiCache(cachedValue, { hasLiveProvider = false, signature } = {}) {
  if (!cachedValue?.audit) return false;

  const sourceStatus = String(cachedValue.audit?.source?.status || '');
  const isLive = sourceStatus === 'live';
  const ageMs = readCacheAgeMs(cachedValue.updatedAt);
  const sameSignature = cachedValue.signature === signature;
  const liveTtlMs = Number(cachedValue.liveTtlMs || 0) || aiUsagePolicy.detailLiveTtlMs;

  if (!hasLiveProvider) {
    return sameSignature && ageMs < aiUsagePolicy.detailFallbackRetryMs;
  }

  if (isLive && ageMs < liveTtlMs) {
    return true;
  }

  return sameSignature && ageMs < aiUsagePolicy.detailFallbackRetryMs;
}
