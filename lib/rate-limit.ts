const requestBuckets = new Map<string, number[]>();

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = requestBuckets.get(key) ?? [];
  const recent = bucket.filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= limit) {
    return false;
  }

  recent.push(now);
  requestBuckets.set(key, recent);
  return true;
}
