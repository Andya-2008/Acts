/** Short relative label for feed comments / light timestamps. */
export function formatRelativeFeedTime(date: Date, nowMs: number = Date.now()): string {
  const diffMs = nowMs - date.getTime();
  if (!Number.isFinite(diffMs)) {
    return '';
  }
  if (diffMs < 45_000) {
    return 'Just now';
  }
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `${hrs}h ago`;
  }
  const days = Math.floor(hrs / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
