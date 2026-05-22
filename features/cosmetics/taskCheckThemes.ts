import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

type IonName = ComponentProps<typeof Ionicons>['name'];

export type TaskCheckThemeId =
  | 'default'
  | 'dawn_glow'
  | 'forest_moss'
  | 'golden_medal'
  | 'ocean_neon'
  | 'candy_party'
  | 'starfield';

export type TaskCheckThemeMeta = {
  id: TaskCheckThemeId;
  label: string;
  ion: IonName;
  /** Ionicons name for the empty checkbox */
  emptyIcon: IonName;
  /** Ionicons name when completed */
  doneIcon: IonName;
  emptyColor: string;
  doneColor: string;
  /** Outer ring (unchecked) */
  ringBorder: string;
  ringBg: string;
  /** Outer ring when task is done */
  ringBorderDone: string;
  ringBgDone: string;
  /** Full task row outline/fill (shop themes only; `default` uses standard list card chrome). */
  cardBorder?: string;
  cardBg?: string;
  cardBorderDone?: string;
  cardBgDone?: string;
};

export const TASK_CHECK_THEMES: Record<TaskCheckThemeId, TaskCheckThemeMeta> = {
  default: {
    id: 'default',
    label: 'Classic',
    ion: 'ellipse-outline',
    emptyIcon: 'ellipse-outline',
    doneIcon: 'checkmark-circle',
    emptyColor: '#8B6F82',
    doneColor: '#E11D74',
    ringBorder: 'border-transparent',
    ringBg: 'bg-transparent',
    ringBorderDone: 'border-transparent',
    ringBgDone: 'bg-transparent',
  },
  dawn_glow: {
    id: 'dawn_glow',
    label: 'Dawn Glow',
    ion: 'sunny',
    emptyIcon: 'ellipse-outline',
    doneIcon: 'checkmark-circle',
    emptyColor: '#C27803',
    doneColor: '#EA580C',
    ringBorder: 'border-amber-300/90',
    ringBg: 'bg-amber-50/90',
    ringBorderDone: 'border-orange-400',
    ringBgDone: 'bg-orange-50',
    cardBorder: 'border-amber-300/90',
    cardBg: 'bg-amber-50/85',
    cardBorderDone: 'border-orange-400',
    cardBgDone: 'bg-orange-50/90',
  },
  forest_moss: {
    id: 'forest_moss',
    label: 'Forest Moss',
    ion: 'leaf',
    emptyIcon: 'ellipse-outline',
    doneIcon: 'checkmark-circle',
    emptyColor: '#3F6212',
    doneColor: '#15803D',
    ringBorder: 'border-emerald-400/85',
    ringBg: 'bg-emerald-50/95',
    ringBorderDone: 'border-emerald-500',
    ringBgDone: 'bg-emerald-100/90',
    cardBorder: 'border-emerald-400/85',
    cardBg: 'bg-emerald-50/90',
    cardBorderDone: 'border-emerald-500',
    cardBgDone: 'bg-emerald-100/85',
  },
  golden_medal: {
    id: 'golden_medal',
    label: 'Golden Medal',
    ion: 'ribbon',
    emptyIcon: 'ellipse-outline',
    doneIcon: 'checkmark-circle',
    emptyColor: '#A16207',
    doneColor: '#CA8A04',
    ringBorder: 'border-yellow-500/90',
    ringBg: 'bg-yellow-50',
    ringBorderDone: 'border-amber-500',
    ringBgDone: 'bg-amber-100/95',
    cardBorder: 'border-yellow-500/90',
    cardBg: 'bg-yellow-50/95',
    cardBorderDone: 'border-amber-500',
    cardBgDone: 'bg-amber-100/90',
  },
  ocean_neon: {
    id: 'ocean_neon',
    label: 'Ocean Neon',
    ion: 'water',
    emptyIcon: 'ellipse-outline',
    doneIcon: 'checkmark-circle',
    emptyColor: '#0369A1',
    doneColor: '#0EA5E9',
    ringBorder: 'border-sky-400/90',
    ringBg: 'bg-sky-50/95',
    ringBorderDone: 'border-cyan-500',
    ringBgDone: 'bg-cyan-50',
    cardBorder: 'border-sky-400/90',
    cardBg: 'bg-sky-50/90',
    cardBorderDone: 'border-cyan-500',
    cardBgDone: 'bg-cyan-50/95',
  },
  candy_party: {
    id: 'candy_party',
    label: 'Candy Pop',
    ion: 'color-palette',
    emptyIcon: 'ellipse-outline',
    doneIcon: 'checkmark-circle',
    emptyColor: '#DB2777',
    doneColor: '#E11D74',
    ringBorder: 'border-pink-400/90',
    ringBg: 'bg-pink-50',
    ringBorderDone: 'border-fuchsia-500',
    ringBgDone: 'bg-fuchsia-50',
    cardBorder: 'border-pink-400/90',
    cardBg: 'bg-pink-50/95',
    cardBorderDone: 'border-fuchsia-500',
    cardBgDone: 'bg-fuchsia-50/95',
  },
  starfield: {
    id: 'starfield',
    label: 'Starfield',
    ion: 'planet',
    emptyIcon: 'ellipse-outline',
    doneIcon: 'checkmark-circle',
    emptyColor: '#5B21B6',
    doneColor: '#7C3AED',
    ringBorder: 'border-violet-400/90',
    ringBg: 'bg-violet-50/95',
    ringBorderDone: 'border-indigo-500',
    ringBgDone: 'bg-indigo-50',
    cardBorder: 'border-violet-400/90',
    cardBg: 'bg-violet-50/90',
    cardBorderDone: 'border-indigo-500',
    cardBgDone: 'bg-indigo-50/95',
  },
};

const THEME_IDS = Object.keys(TASK_CHECK_THEMES) as TaskCheckThemeId[];

/** Stable order for shop / pickers */
export const TASK_CHECK_THEME_LIST: TaskCheckThemeId[] = [
  'default',
  'dawn_glow',
  'forest_moss',
  'golden_medal',
  'ocean_neon',
  'candy_party',
  'starfield',
];

export function normalizeTaskCheckThemeId(raw: string | undefined | null): TaskCheckThemeId {
  const t = (raw ?? '').trim();
  if (THEME_IDS.includes(t as TaskCheckThemeId)) {
    return t as TaskCheckThemeId;
  }
  return 'default';
}

/** Build set of theme ids the user may equip (always includes `default`). Pass shop item ids owned. */
export function buildOwnedTaskCheckThemeSet(
  ownedShopIds: Iterable<string>,
  itemIdToThemeId: Map<string, TaskCheckThemeId>,
): Set<TaskCheckThemeId> {
  const out = new Set<TaskCheckThemeId>(['default']);
  for (const id of ownedShopIds) {
    const th = itemIdToThemeId.get(id);
    if (th) {
      out.add(th);
    }
  }
  return out;
}

/** Active theme must be `default` or present in `ownedThemes`. */
export function resolveEquippedTaskCheckTheme(
  actsActive: string | undefined | null,
  ownedThemes: Set<TaskCheckThemeId>,
): TaskCheckThemeId {
  const want = normalizeTaskCheckThemeId(actsActive);
  if (want === 'default') {
    return 'default';
  }
  if (ownedThemes.has(want)) {
    return want;
  }
  return 'default';
}
