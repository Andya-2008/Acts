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

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) {
    return null;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) {
    return null;
  }
  return { r, g, b };
}

/** WCAG relative luminance (0 = black, 1 = white) for a `#RRGGBB` color. */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) {
    return 1;
  }
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

export type ReadableTextColors = { primary: string; secondary: string };

const DARK_TEXT: ReadableTextColors = { primary: '#1F2430', secondary: '#5B6472' };
const LIGHT_TEXT: ReadableTextColors = { primary: '#F1F5F9', secondary: '#B6C0CE' };

/** Pick legible text colors (dark or light) for content sitting directly on `bgHex`. */
export function readableTextColors(bgHex: string): ReadableTextColors {
  return relativeLuminance(bgHex) > 0.45 ? DARK_TEXT : LIGHT_TEXT;
}
