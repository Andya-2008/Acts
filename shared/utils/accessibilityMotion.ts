import { LayoutAnimation as LA, type LayoutAnimationConfig } from 'react-native';

import type { ActAppearancePalette } from '@/shared/theme/appearancePalettes';

const EASE_LIST: LayoutAnimationConfig = {
  duration: 340,
  update: { type: LA.Types.easeInEaseOut },
  create: { type: LA.Types.easeInEaseOut, property: LA.Properties.opacity },
  delete: { type: LA.Types.easeInEaseOut, property: LA.Properties.opacity },
};

/** Skips list/layout animations when Reduce Motion is on. */
export function configureActsLayoutAnimation(reduceMotion: boolean, config: LayoutAnimationConfig = EASE_LIST): void {
  if (reduceMotion) {
    return;
  }
  LA.configureNext(config);
}

/** Selected settings chips: color + heavier border so state is not color-only. */
export function actsSelectionChipStyle(
  palette: ActAppearancePalette,
  selected: boolean,
): { backgroundColor: string; borderColor: string; borderWidth: number } {
  if (selected) {
    return {
      backgroundColor: palette.green,
      borderColor: palette.ink,
      borderWidth: 2,
    };
  }
  return {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
  };
}

/** Fast timing for overlays when Reduce Motion is on (opacity only, no springs). */
export function overlayMotionDuration(reduceMotion: boolean, normalMs: number): number {
  return reduceMotion ? Math.min(120, normalMs) : normalMs;
}

/** Sheet / alert modals: skip motion when Reduce Motion is on. */
export function modalAnimationType(
  reduceMotion: boolean,
  preferred: 'none' | 'fade' | 'slide',
): 'none' | 'fade' | 'slide' {
  return reduceMotion ? 'none' : preferred;
}

/** Color-theme swatches (shop + settings appearance). */
export function appearancePresetChipStyle(
  palette: ActAppearancePalette,
  selected: boolean,
): { backgroundColor: string; borderColor: string; borderWidth: number } {
  return {
    backgroundColor: selected ? palette.green : palette.surface,
    borderColor: selected ? palette.ink : palette.border,
    borderWidth: selected ? 2 : 1,
  };
}

/** Filter / equip chips in shop and task filters. */
export function filterChipStyle(
  palette: ActAppearancePalette,
  selected: boolean,
): { backgroundColor: string; borderColor: string; borderWidth: number } {
  if (selected) {
    return {
      backgroundColor: palette.greenSoft,
      borderColor: palette.ink,
      borderWidth: 2,
    };
  }
  return {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
  };
}

export function equipChipAccessibilityLabel(
  name: string,
  options?: { selected?: boolean; locked?: boolean; kind?: string },
): string {
  const kind = options?.kind ?? 'style';
  if (options?.locked) {
    return `${name} ${kind}, locked`;
  }
  if (options?.selected) {
    return `${name} ${kind}, selected`;
  }
  return `Equip ${name} ${kind}`;
}

export function shopItemBuyAccessibilityLabel(item: {
  title: string;
  seedCost: number;
  owned: boolean;
}): string {
  if (item.owned) {
    return `${item.title}, owned`;
  }
  return `Buy ${item.title} for ${item.seedCost} seeds`;
}

/** VoiceOver label for profile / friends primary actions. */
export function profileActionAccessibilityLabel(action: string, personName: string): string {
  return `${action} ${personName}`;
}
