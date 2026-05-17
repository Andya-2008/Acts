export const actsTheme = {
  colors: {
    canvas: '#FAFAF8',
    surface: '#FFFFFF',
    muted: '#6B7280',
    ink: '#1F2937',
    green: '#3D8B6E',
    greenSoft: '#E8F3EE',
    blue: '#4A7ABF',
    blueSoft: '#EAF0FA',
    border: '#E5E7EB',
    danger: '#DC2626',
  },
  radii: {
    card: 16,
    control: 12,
    pill: 999,
  },
  spacing: {
    screenPadding: 20,
  },
} as const;

export type ActsTheme = typeof actsTheme;
