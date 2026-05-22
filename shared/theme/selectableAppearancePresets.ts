import { SHOP_ITEMS } from '@/features/shop/shopCatalog';
import {
  FREE_ACT_APPEARANCE_PRESET_IDS,
  type ActAppearanceColorPresetId,
} from '@/shared/theme/appearancePalettes';

/** Free presets plus any shop-unlocked appearance backdrops the user owns. */
export function selectableAppearancePresets(shopPurchasedIds: string[] | undefined): ActAppearanceColorPresetId[] {
  const owned = new Set(shopPurchasedIds ?? []);
  const fromShop = SHOP_ITEMS.filter(
    (i) => i.kind === 'appearancePreset' && i.unlocksAppearancePresetId && owned.has(i.id),
  ).map((i) => i.unlocksAppearancePresetId!);
  return [...FREE_ACT_APPEARANCE_PRESET_IDS, ...fromShop];
}
