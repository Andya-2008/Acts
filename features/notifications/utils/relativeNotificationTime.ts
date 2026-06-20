/** Compact relative timestamp for inbox rows and section headers. */
export function relativeNotificationTime(ms: number, nowMs = Date.now()): string {
  if (!ms) {
    return '';
  }
  const seconds = Math.floor((nowMs - ms) / 1000);
  if (seconds < 60) {
    return 'just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
