import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { DeedReactionKind } from '@/shared/types/deedReaction';
import { FREE_DEED_REACTION_KINDS } from '@/shared/constants/deedReactions';

import type { TaskCheckThemeId } from '@/features/cosmetics/taskCheckThemes';
import { buildOwnedTaskCheckThemeSet } from '@/features/cosmetics/taskCheckThemes';
import {
  SHOP_ID_ROSTER_DAILY,
  SHOP_ID_ROSTER_MONTHLY,
  SHOP_ID_ROSTER_WEEKLY,
} from '@/features/shop/shopEntitlements';

import type { ActAppearanceColorPresetId } from '@/shared/theme/appearancePalettes';

type IonName = ComponentProps<typeof Ionicons>['name'];

export type ShopItemKind =
  | 'taskTheme'
  | 'deedReactionPack'
  | 'appearancePreset'
  | 'extraRosterDaily'
  | 'extraRosterWeekly'
  | 'extraRosterMonthly';

export type ShopSectionId = 'app_appearance' | 'task_appearance' | 'deed_feed' | 'boosts';

export type ShopItem = {
  id: string;
  title: string;
  description: string;
  seedCost: number;
  kind: ShopItemKind;
  section: ShopSectionId;
  /** Shown in the shop grid */
  icon: IonName;
  /** Accent for gamey cards (Ionicons hex) */
  accentColor: string;
  /** When `kind` is `taskTheme`, which checkbox theme this unlocks. */
  unlocksThemeId?: TaskCheckThemeId;
  /** When `kind` is `deedReactionPack`, extra deed-feed reaction emoji(s) unlocked for the buyer. */
  unlocksReactionKinds?: DeedReactionKind[];
  /** When `kind` is `appearancePreset`, background palette unlocked (and equipped on purchase). */
  unlocksAppearancePresetId?: ActAppearanceColorPresetId;
};

/** Static catalog; ownership stored on `userInfo.ShopPurchasedIds`. */
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'appearance_midnight',
    title: 'Midnight studio',
    description: 'Deep navy canvas and neon accents—late-night kindness sessions.',
    seedCost: 56,
    kind: 'appearancePreset',
    section: 'app_appearance',
    icon: 'moon',
    accentColor: '#38BDF8',
    unlocksAppearancePresetId: 'midnight',
  },
  {
    id: 'appearance_lavender_mist',
    title: 'Lavender mist',
    description: 'Soft violet glow for calmer scrolls and gentler focus.',
    seedCost: 48,
    kind: 'appearancePreset',
    section: 'app_appearance',
    icon: 'color-filter',
    accentColor: '#A855F7',
    unlocksAppearancePresetId: 'lavender_mist',
  },
  {
    id: 'appearance_desert_sand',
    title: 'Desert sand',
    description: 'Warm parchment tones—sunrise acts and golden-hour vibes.',
    seedCost: 44,
    kind: 'appearancePreset',
    section: 'app_appearance',
    icon: 'partly-sunny-outline',
    accentColor: '#C2410C',
    unlocksAppearancePresetId: 'desert_sand',
  },
  {
    id: 'appearance_aurora_night',
    title: 'Aurora night',
    description: 'Mint-and-sky wash that makes deeds feel fresh off the trail.',
    seedCost: 62,
    kind: 'appearancePreset',
    section: 'app_appearance',
    icon: 'planet',
    accentColor: '#14B8A6',
    unlocksAppearancePresetId: 'aurora_night',
  },
  {
    id: SHOP_ID_ROSTER_DAILY,
    title: '+1 daily act slot',
    description: 'Adds one more rotating daily act to your home roster (4 daily picks instead of 3).',
    seedCost: 46,
    kind: 'extraRosterDaily',
    section: 'boosts',
    icon: 'today',
    accentColor: '#E11D74',
  },
  {
    id: SHOP_ID_ROSTER_WEEKLY,
    title: '+1 weekly act slot',
    description: 'Adds one more weekly act to your home roster for bigger weekly variety.',
    seedCost: 58,
    kind: 'extraRosterWeekly',
    section: 'boosts',
    icon: 'calendar',
    accentColor: '#2563EB',
  },
  {
    id: SHOP_ID_ROSTER_MONTHLY,
    title: '+1 monthly act slot',
    description: 'Adds one more monthly act—room for deeper, slower projects.',
    seedCost: 68,
    kind: 'extraRosterMonthly',
    section: 'boosts',
    icon: 'hourglass',
    accentColor: '#7C3AED',
  },
  {
    id: 'theme_dawn_glow',
    title: 'Dawn Glow',
    description: 'Warm sunrise rings around your act checkboxes—early bird energy.',
    seedCost: 28,
    kind: 'taskTheme',
    section: 'task_appearance',
    icon: 'sunny',
    accentColor: '#EA580C',
    unlocksThemeId: 'dawn_glow',
  },
  {
    id: 'theme_forest_moss',
    title: 'Forest Moss',
    description: 'Soft green chrome for your tasks—grow the good, one checkbox at a time.',
    seedCost: 32,
    kind: 'taskTheme',
    section: 'task_appearance',
    icon: 'leaf',
    accentColor: '#15803D',
    unlocksThemeId: 'forest_moss',
  },
  {
    id: 'theme_golden_medal',
    title: 'Golden Medal',
    description: 'Champion sparkle when you complete an act. Victory lap optional.',
    seedCost: 55,
    kind: 'taskTheme',
    section: 'task_appearance',
    icon: 'medal',
    accentColor: '#CA8A04',
    unlocksThemeId: 'golden_medal',
  },
  {
    id: 'theme_ocean_neon',
    title: 'Ocean Neon',
    description: 'Cool cyan pop—your list feels like a high-score screen.',
    seedCost: 40,
    kind: 'taskTheme',
    section: 'task_appearance',
    icon: 'water',
    accentColor: '#0EA5E9',
    unlocksThemeId: 'ocean_neon',
  },
  {
    id: 'theme_candy_party',
    title: 'Candy Pop',
    description: 'Playful pink frames for people who make kindness fun.',
    seedCost: 36,
    kind: 'taskTheme',
    section: 'task_appearance',
    icon: 'color-palette',
    accentColor: '#DB2777',
    unlocksThemeId: 'candy_party',
  },
  {
    id: 'theme_starfield',
    title: 'Starfield',
    description: 'Violet orbit rings—save the world, RPG style.',
    seedCost: 72,
    kind: 'taskTheme',
    section: 'task_appearance',
    icon: 'planet',
    accentColor: '#7C3AED',
    unlocksThemeId: 'starfield',
  },
  {
    id: 'reaction_emoji_rocket',
    title: 'Rocket cheer',
    description: 'Blast a little encouragement onto friends’ deeds—unlocks the rocket reaction.',
    seedCost: 22,
    kind: 'deedReactionPack',
    section: 'deed_feed',
    icon: 'rocket-outline',
    accentColor: '#7C3AED',
    unlocksReactionKinds: ['rocket'],
  },
  {
    id: 'reaction_emoji_pray',
    title: 'Grateful hands',
    description: 'Say thanks with heart—unlocks the folded-hands reaction.',
    seedCost: 20,
    kind: 'deedReactionPack',
    section: 'deed_feed',
    icon: 'hand-left-outline',
    accentColor: '#0D9488',
    unlocksReactionKinds: ['pray'],
  },
  {
    id: 'reaction_emoji_flame',
    title: 'On fire',
    description: 'When a deed is straight-up amazing—unlocks the flame reaction.',
    seedCost: 24,
    kind: 'deedReactionPack',
    section: 'deed_feed',
    icon: 'flame-outline',
    accentColor: '#EA580C',
    unlocksReactionKinds: ['flame'],
  },
  {
    id: 'reaction_emoji_rainbow',
    title: 'Rainbow beam',
    description: 'Spread joy in full color—unlocks the rainbow reaction.',
    seedCost: 26,
    kind: 'deedReactionPack',
    section: 'deed_feed',
    icon: 'color-filter-outline',
    accentColor: '#DB2777',
    unlocksReactionKinds: ['rainbow'],
  },
  {
    id: 'reaction_emoji_party',
    title: 'Party popper',
    description: 'Big wins deserve a celebration—unlocks the party reaction.',
    seedCost: 28,
    kind: 'deedReactionPack',
    section: 'deed_feed',
    icon: 'musical-notes-outline',
    accentColor: '#CA8A04',
    unlocksReactionKinds: ['party'],
  },
  {
    id: 'reaction_emoji_hundred',
    title: 'Perfect score',
    description: 'Drop a 💯 when something is flawless—unlocks the 100 reaction.',
    seedCost: 18,
    kind: 'deedReactionPack',
    section: 'deed_feed',
    icon: 'ribbon-outline',
    accentColor: '#2563EB',
    unlocksReactionKinds: ['hundred'],
  },
];

export const SHOP_SECTION_ORDER: ShopSectionId[] = ['app_appearance', 'task_appearance', 'deed_feed', 'boosts'];

export const SHOP_SECTION_META: Record<ShopSectionId, { title: string; blurb: string }> = {
  app_appearance: {
    title: 'App appearance',
    blurb: 'Premium color backdrops—unlock once, then pick them anytime in Settings → Appearance.',
  },
  task_appearance: {
    title: 'Task list flair',
    blurb: 'Make completing acts feel like leveling up—checkbox rings and list chrome.',
  },
  deed_feed: {
    title: 'Deed feed & sharing',
    blurb: 'Extra reactions to celebrate friends’ deeds.',
  },
  boosts: {
    title: 'Boosts & home roster',
    blurb: 'Extra catalog slots so your kindness list never feels cramped.',
  },
};

export function shopItemIdToThemeMap(): Map<string, TaskCheckThemeId> {
  const m = new Map<string, TaskCheckThemeId>();
  for (const it of SHOP_ITEMS) {
    if (it.kind === 'taskTheme' && it.unlocksThemeId) {
      m.set(it.id, it.unlocksThemeId);
    }
  }
  return m;
}

export function shopItemsForSection(section: ShopSectionId): ShopItem[] {
  return SHOP_ITEMS.filter((i) => i.section === section);
}

/** Free reactions + any extra emoji kinds unlocked via shop purchases. */
export function deedReactionKindsForViewer(shopPurchasedIds: string[] | undefined): DeedReactionKind[] {
  const owned = new Set(shopPurchasedIds ?? []);
  const extras: DeedReactionKind[] = [];
  for (const item of SHOP_ITEMS) {
    if (item.kind !== 'deedReactionPack' || !item.unlocksReactionKinds?.length) {
      continue;
    }
    if (!owned.has(item.id)) {
      continue;
    }
    for (const k of item.unlocksReactionKinds) {
      extras.push(k);
    }
  }
  return [...FREE_DEED_REACTION_KINDS, ...extras];
}

export function ownedTaskThemeSet(ownedShopIds: string[] | undefined): Set<TaskCheckThemeId> {
  return buildOwnedTaskCheckThemeSet(ownedShopIds ?? [], shopItemIdToThemeMap());
}
