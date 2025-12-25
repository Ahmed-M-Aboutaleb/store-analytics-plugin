export function parseLimitOffset(limitRaw: unknown, offsetRaw: unknown) {
  const parsedLimit = Number.isFinite(Number(limitRaw))
    ? Number(limitRaw)
    : NaN;
  const parsedOffset = Number.isFinite(Number(offsetRaw))
    ? Number(offsetRaw)
    : NaN;
  const limit = Math.max(1, Math.min(parsedLimit || 25, 200));
  const offset = Math.max(0, parsedOffset || 0);
  return { limit, offset };
}
