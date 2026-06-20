import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import type { ShopItem } from '@/features/shop/shopCatalog';
import { AppButton, AppCard, AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

type RewardsDiscoveryPromptCardProps = {
  seeds: number;
  highlight: ShopItem;
  onBrowseRewards: () => void;
  onDismiss: () => void;
  className?: string;
};

export function RewardsDiscoveryPromptCard({
  seeds,
  highlight,
  onBrowseRewards,
  onDismiss,
  className = '',
}: RewardsDiscoveryPromptCardProps) {
  const act = useActAppearance();
  const canAfford = seeds >= highlight.seedCost;
  const seedsToGo = Math.max(0, highlight.seedCost - seeds);

  return (
    <AppCard className={`border-2 border-amber-400/50 bg-amber-50/90 p-4 ${className}`}>
      <View className="mb-3 flex-row items-start">
        <View
          className="mr-3 h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${act.palette.green}22` }}>
          <Ionicons name="gift" size={26} color={act.palette.green} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText variant="subtitle" className="mb-1 text-acts-ink">
            You earned seeds!
          </AppText>
          <AppText variant="caption" className="leading-5 text-acts-muted">
            Acts pays seeds when you complete acts. Spend them in Rewards to customize your checkboxes
            and more.
          </AppText>
        </View>
      </View>

      <View
        className="mb-4 flex-row items-center self-start rounded-full px-3 py-1.5"
        style={{ backgroundColor: act.palette.surface }}>
        <Ionicons name="leaf" size={14} color={act.palette.green} />
        <AppText variant="caption" className="ml-1.5 font-semibold text-acts-green">
          {seeds.toLocaleString()} seeds in your balance
        </AppText>
      </View>

      <View className="mb-4 rounded-2xl border border-acts-border/70 bg-acts-surface p-3">
        <View className="flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${highlight.accentColor}22` }}>
            <Ionicons name={highlight.icon} size={22} color={highlight.accentColor} />
          </View>
          <View className="min-w-0 flex-1">
            <AppText variant="subtitle" className="text-acts-ink">
              {highlight.title}
            </AppText>
            <AppText variant="caption" className="mt-0.5 text-acts-muted">
              {canAfford
                ? `Checkbox theme · ${highlight.seedCost} seeds — ready to unlock`
                : `Checkbox theme · ${highlight.seedCost} seeds (${seedsToGo} more to go)`}
            </AppText>
          </View>
        </View>
      </View>

      <AppButton
        title="Browse Rewards"
        className="mb-2 w-full"
        accessibilityLabel="Open Rewards shop to spend seeds"
        onPress={onBrowseRewards}
      />
      <AppButton
        title="Maybe later"
        variant="secondary"
        className="w-full"
        accessibilityLabel="Dismiss rewards discovery tip"
        onPress={onDismiss}
      />
    </AppCard>
  );
}

/** Opens the Rewards shop. */
export function openRewardsShop(): void {
  router.push('/(app)/shop' as Href);
}
