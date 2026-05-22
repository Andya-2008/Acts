import { vars } from 'nativewind';

import type { ActAppearancePalette } from '@/shared/theme/appearancePalettes';
import { hexToRgbChannels } from '@/shared/theme/colorUtils';

/** NativeWind CSS variables so `bg-acts-*` / `text-acts-*` follow the active appearance palette. */
export function buildActsThemeVars(palette: ActAppearancePalette) {
  return vars({
    '--color-acts-canvas': hexToRgbChannels(palette.canvas),
    '--color-acts-surface': hexToRgbChannels(palette.surface),
    '--color-acts-muted': hexToRgbChannels(palette.muted),
    '--color-acts-ink': hexToRgbChannels(palette.ink),
    '--color-acts-green': hexToRgbChannels(palette.green),
    '--color-acts-green-soft': hexToRgbChannels(palette.greenSoft),
    '--color-acts-blue': hexToRgbChannels(palette.blue),
    '--color-acts-blue-soft': hexToRgbChannels(palette.blueSoft),
    '--color-acts-border': hexToRgbChannels(palette.border),
    '--color-acts-danger': hexToRgbChannels(palette.danger),
  });
}
