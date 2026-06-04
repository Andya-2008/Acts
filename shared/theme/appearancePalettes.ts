/**
 * Semantic UI colors for the in-app appearance system (see `ActAppearanceProvider`).
 * Tailwind `acts-*` classes stay as defaults for unwrapped UI; provider-driven screens use these via `style`.
 */
/** Free in Settings; shop can unlock additional ids below. */
export type ActAppearanceColorPresetId =
  | 'blossom'
  | 'evergreen'
  | 'ocean'
  | 'dawn'
  | 'midnight'
  | 'lavender_mist'
  | 'desert_sand'
  | 'aurora_night';

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
  /** Dark themes need surfaces (not light tints) so palette ink text stays legible. */
  isDark: boolean;
};

export const FREE_ACT_APPEARANCE_PRESET_IDS = ['blossom', 'evergreen', 'ocean', 'dawn'] as const satisfies readonly ActAppearanceColorPresetId[];

export type FreeActAppearanceColorPresetId = (typeof FREE_ACT_APPEARANCE_PRESET_IDS)[number];

export const ACT_APPEARANCE_PRESET_LABELS: Record<ActAppearanceColorPresetId, string> = {
  blossom: 'Blossom',
  evergreen: 'Evergreen',
  ocean: 'Ocean',
  dawn: 'Dawn',
  midnight: 'Midnight studio',
  lavender_mist: 'Lavender mist',
  desert_sand: 'Desert sand',
  aurora_night: 'Aurora night',
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
  isDark: false,
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
  isDark: false,
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
  isDark: false,
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
  isDark: false,
};

const MIDNIGHT: ActAppearancePalette = {
  canvas: '#0B1220',
  surface: '#151F32',
  ink: '#F1F5F9',
  muted: '#94A3B8',
  green: '#38BDF8',
  greenSoft: '#0C4A6E',
  blue: '#818CF8',
  blueSoft: '#1E1B4B',
  border: '#334155',
  danger: '#F87171',
  isDark: true,
};

const LAVENDER_MIST: ActAppearancePalette = {
  canvas: '#FAF5FF',
  surface: '#FFFFFF',
  ink: '#2E1065',
  muted: '#7C6AA0',
  green: '#A855F7',
  greenSoft: '#F3E8FF',
  blue: '#6366F1',
  blueSoft: '#EEF2FF',
  border: '#DDD6FE',
  danger: '#DC2626',
  isDark: false,
};

const DESERT_SAND: ActAppearancePalette = {
  canvas: '#FAF8F5',
  surface: '#FFFFFF',
  ink: '#422006',
  muted: '#92745B',
  green: '#C2410C',
  greenSoft: '#FFEDD5',
  blue: '#B45309',
  blueSoft: '#FEF3C7',
  border: '#E7D5C4',
  danger: '#B91C1C',
  isDark: false,
};

const AURORA_NIGHT: ActAppearancePalette = {
  canvas: '#ECFDF5',
  surface: '#F8FAFC',
  ink: '#042F2E',
  muted: '#0F766E',
  green: '#14B8A6',
  greenSoft: '#CCFBF1',
  blue: '#0EA5E9',
  blueSoft: '#E0F2FE',
  border: '#99F6E4',
  danger: '#DC2626',
  isDark: false,
};

const PRESETS: Record<ActAppearanceColorPresetId, ActAppearancePalette> = {
  blossom: BLOSSOM,
  evergreen: EVERGREEN,
  ocean: OCEAN,
  dawn: DAWN,
  midnight: MIDNIGHT,
  lavender_mist: LAVENDER_MIST,
  desert_sand: DESERT_SAND,
  aurora_night: AURORA_NIGHT,
};

export function resolveActAppearancePalette(preset: string | undefined | null): ActAppearancePalette {
  if (preset != null && preset in PRESETS) {
    return PRESETS[preset as ActAppearanceColorPresetId];
  }
  return PRESETS.blossom;
}

export const DEFAULT_ACT_APPEARANCE_PALETTE = BLOSSOM;
