import { SHOP_ITEMS, ownedTaskThemeSet, type ShopItem } from '@/features/shop/shopCatalog';
import type { TaskCheckThemeId } from '@/features/cosmetics/taskCheckThemes';

/** True when the user has not unlocked any shop checkbox theme yet. */
export function userNeedsTaskThemeDiscovery(shopPurchasedIds: string[] | undefined): boolean {
  const owned = ownedTaskThemeSet(shopPurchasedIds);
  const shopThemes: TaskCheckThemeId[] = [
    'dawn_glow',
    'forest_moss',
    'golden_medal',
    'ocean_neon',
    'candy_party',
    'starfield',
  ];
  return !shopThemes.some((id) => owned.has(id));
}

/** Cheapest unowned task theme, or any affordable highlight for the discovery card. */
export function suggestRewardsHighlightItem(
  seeds: number,
  shopPurchasedIds: string[] | undefined,
): ShopItem | null {
  const owned = new Set(shopPurchasedIds ?? []);
  const themes = SHOP_ITEMS.filter((item) => item.kind === 'taskTheme' && !owned.has(item.id)).sort(
    (a, b) => a.seedCost - b.seedCost,
  );
  if (themes.length === 0) {
    return null;
  }
  const affordable = themes.find((item) => item.seedCost <= seeds);
  return affordable ?? themes[0]!;
}
