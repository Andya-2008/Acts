import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';

import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { AppText } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';
import { useCurrencyStore } from '@/shared/stores/currencyStore';

type SeedsXpShopHeaderProps = {
  /** When true, omit trailing margin on the rightmost pill. */
  trailing?: boolean;
};

function lifetimeXpFromUserInfo(data: { LifetimeXP?: unknown } | null | undefined): number {
  if (data == null) {
    return 0;
  }
  return Math.max(0, Math.floor(Number(data.LifetimeXP ?? 0)));
}

/**
 * Tasks tab header: Seeds balance, Rewards entry, and lifetime XP.
 */
export function SeedsXpShopHeader({ trailing = false }: SeedsXpShopHeaderProps) {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const seeds = useCurrencyStore((s) => s.balance);
  const xp = lifetimeXpFromUserInfo(userInfo);
  const setPillAnchor = useCurrencyStore((s) => s.setPillAnchor);
  const measureRef = useRef<View>(null);

  const reportAnchor = () => {
    measureRef.current?.measureInWindow((x, y, w, h) => {
      setPillAnchor({ x: x + w / 2, y: y + h / 2 });
    });
  };

  useLayoutEffect(() => {
    requestAnimationFrame(reportAnchor);
  }, [seeds, setPillAnchor]);

  useEffect(() => {
    return () => {
      setPillAnchor(null);
    };
  }, [setPillAnchor]);

  const openRewards = () => router.push('/(app)/shop' as Href);

  return (
    <View className={`flex-row flex-wrap items-center justify-end gap-2 ${trailing ? '' : 'pl-2'}`}>
      <View
        ref={measureRef}
        collapsable={false}
        onLayout={() => requestAnimationFrame(reportAnchor)}
        accessibilityRole="text"
        accessibilityLabel={`Seeds ${seeds}`}
        className="flex-row items-center rounded-full border border-acts-border/60 bg-acts-surface px-2.5 py-1">
        <Ionicons name="leaf" size={16} color="#2F855A" />
        <AppText variant="subtitle" className="ml-1 min-w-[1.25rem] text-right text-acts-ink">
          {seeds}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open rewards"
        accessibilityHint="Spend seeds on themes, reactions, and boosts"
        hitSlop={6}
        onPress={openRewards}
        className="flex-row items-center rounded-full border border-acts-green/50 bg-acts-green-soft px-3 py-1.5 active:opacity-85">
        <Ionicons name="gift-outline" size={18} color="#2F855A" />
        <AppText variant="subtitle" className="ml-1.5 font-semibold text-acts-green">
          Rewards
        </AppText>
      </Pressable>
      <View
        accessibilityRole="text"
        accessibilityLabel={`Experience ${xp}`}
        className="flex-row items-center rounded-full border border-acts-border/60 bg-acts-surface px-2.5 py-1">
        <Ionicons name="sparkles" size={16} color="#B45309" />
        <AppText variant="subtitle" className="ml-1 min-w-[1.25rem] text-right text-acts-ink">
          {xp}
        </AppText>
      </View>
    </View>
  );
}
