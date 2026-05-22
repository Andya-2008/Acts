/** Convert `#RRGGBB` to space-separated channels for Tailwind `rgb(var(--x) / <alpha-value>)`. */
export function hexToRgbChannels(hex: string): string {
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) {
    return '0 0 0';
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}
