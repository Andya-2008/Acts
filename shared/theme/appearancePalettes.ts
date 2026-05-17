/**
 * Semantic UI colors for the in-app appearance system (see `ActAppearanceProvider`).
 * Tailwind `acts-*` classes stay as defaults for unwrapped UI; provider-driven screens use these via `style`.
 */
export type ActAppearanceColorPresetId = 'blossom' | 'evergreen' | 'ocean' | 'dawn';

export type ActAppearancePalette = {
  canvas: string;
  surface: string;
  ink: string;
  muted: string;
  green: string;
  greenSoft: string;
  blue: string;
  blueSoft: string;
  border: string;
  danger: string;
};

export const ACT_APPEARANCE_PRESET_LABELS: Record<ActAppearanceColorPresetId, string> = {
  blossom: 'Blossom',
  evergreen: 'Evergreen',
  ocean: 'Ocean',
  dawn: 'Dawn',
};

const BLOSSOM: ActAppearancePalette = {
  canvas: '#FFF7FB',
  surface: '#FFFFFF',
  ink: '#2D1528',
  muted: '#8B6F82',
  green: '#E11D74',
  greenSoft: '#FCE3F0',
  blue: '#5B6BE8',
  blueSoft: '#E8ECFF',
  border: '#F1C9E0',
  danger: '#DC2626',
};

const EVERGREEN: ActAppearancePalette = {
  canvas: '#F4FAF7',
  surface: '#FFFFFF',
  ink: '#14261E',
  muted: '#4B6B5C',
  green: '#1F7A54',
  greenSoft: '#DCF5E8',
  blue: '#2F6FA0',
  blueSoft: '#E3EEF8',
  border: '#C8E6D6',
  danger: '#B91C1C',
};

const OCEAN: ActAppearancePalette = {
  canvas: '#F3F8FC',
  surface: '#FFFFFF',
  ink: '#10243A',
  muted: '#5A6F82',
  green: '#0D8A9A',
  greenSoft: '#D6F3F6',
  blue: '#2563EB',
  blueSoft: '#E0E9FF',
  border: '#C7D8EA',
  danger: '#DC2626',
};

const DAWN: ActAppearancePalette = {
  canvas: '#FFF9F3',
  surface: '#FFFFFF',
  ink: '#3B2419',
  muted: '#8A6556',
  green: '#D14C38',
  greenSoft: '#FFE4DC',
  blue: '#4A6FA5',
  blueSoft: '#E6EEF9',
  border: '#F0D4C4',
  danger: '#B91C1C',
};

const PRESETS: Record<ActAppearanceColorPresetId, ActAppearancePalette> = {
  blossom: BLOSSOM,
  evergreen: EVERGREEN,
  ocean: OCEAN,
  dawn: DAWN,
};

export function resolveActAppearancePalette(preset: string | undefined | null): ActAppearancePalette {
  if (preset === 'evergreen' || preset === 'ocean' || preset === 'dawn' || preset === 'blossom') {
    return PRESETS[preset];
  }
  return PRESETS.blossom;
}

export const DEFAULT_ACT_APPEARANCE_PALETTE = BLOSSOM;
