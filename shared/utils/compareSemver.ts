/** Returns 1 if a > b, -1 if a < b, 0 if equal (numeric semver segments). */
export function compareSemver(a: string, b: string): number {
  const pa = a.trim().split('.').map((part) => parseInt(part.replace(/[^0-9].*$/, ''), 10) || 0);
  const pb = b.trim().split('.').map((part) => parseInt(part.replace(/[^0-9].*$/, ''), 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) {
      return 1;
    }
    if (na < nb) {
      return -1;
    }
  }
  return 0;
}

export function isSemverNewer(candidate: string, baseline: string): boolean {
  return compareSemver(candidate, baseline) > 0;
}
