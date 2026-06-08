import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { RewardedAdsSectionGate } from '@/features/rewarded-ads/RewardedAdsSectionGate';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { TASK_CHECK_THEME_LIST, TASK_CHECK_THEMES, normalizeTaskCheckThemeId, type TaskCheckThemeId } from '@/features/cosmetics/taskCheckThemes';
import {
  SHOP_ITEMS,
  SHOP_SECTION_META,
  SHOP_SECTION_ORDER,
  ownedTaskThemeSet,
  shopItemsForSection,
  type ShopItem,
  type ShopSectionId,
} from '@/features/shop/shopCatalog';
import { useEnsureAssignedTasksMutation } from '@/features/tasks/hooks/useTasksQueries';
import { useMergeActsSettingsMutation } from '@/features/user-profile/hooks/useUserInfoMutations';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { purchaseShopItem } from '@/features/user-profile/services/userInfoRepository';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { DEED_REACTION_EMOJI } from '@/shared/constants/deedReactions';
import { AppButton, AppCard, AppText, Screen, TitleWithInfo } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import {
  appearancePresetChipStyle,
  equipChipAccessibilityLabel,
  filterChipStyle,
  shopItemBuyAccessibilityLabel,
} from '@/shared/utils/accessibilityMotion';
import {
  ACT_APPEARANCE_PRESET_LABELS,
  resolveActAppearancePalette,
  type ActAppearanceColorPresetId,
} from '@/shared/theme/appearancePalettes';
import { selectableAppearancePresets } from '@/shared/theme/selectableAppearancePresets';
import { useAuthStore } from '@/shared/stores/authStore';
import { useCurrencyStore } from '@/shared/stores/currencyStore';

function LootRow({
  item,
  owned,
  busy,
  onBuy,
  act,
}: {
  item: ShopItem;
  owned: boolean;
  busy: boolean;
  onBuy: () => void;
  act: ReturnType<typeof useActAppearance>;
}) {
  return (
    <AppCard className="mb-3 rounded-2xl border-2 p-0" style={{ borderColor: `${item.accentColor}55` }}>
      <View className="flex-row items-stretch">
        <View
          className="w-[72px] items-center justify-center px-2"
          style={{ backgroundColor: `${item.accentColor}22` }}>
          <Ionicons name={item.icon} size={36} color={item.accentColor} />
        </View>
        <View className="min-w-0 flex-1 p-4">
          <AppText variant="subtitle" className="text-acts-ink">
            {item.title}
          </AppText>
          <AppText variant="caption" className="mt-1 text-acts-muted">
            {item.description}
          </AppText>
          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <View className="rounded-full bg-acts-green-soft px-2.5 py-1">
              <AppText variant="caption" className="font-bold text-acts-green">
                {item.seedCost} seeds
              </AppText>
            </View>
            {item.kind === 'taskTheme' ? (
              <View className="rounded-full bg-violet-100 px-2.5 py-1">
                <AppText variant="caption" className="font-bold text-violet-800">
                  Task look
                </AppText>
              </View>
            ) : null}
            {item.kind === 'deedReactionPack' ? (
              <View className="rounded-full bg-sky-100 px-2.5 py-1">
                <AppText variant="caption" className="font-bold text-sky-800">
                  Deed reactions
                </AppText>
              </View>
            ) : null}
            {item.kind === 'appearancePreset' ? (
              <View className="rounded-full bg-fuchsia-100 px-2.5 py-1">
                <AppText variant="caption" className="font-bold text-fuchsia-900">
                  App backdrop
                </AppText>
              </View>
            ) : null}
            {item.kind === 'extraRosterDaily' || item.kind === 'extraRosterWeekly' || item.kind === 'extraRosterMonthly' ? (
              <View className="rounded-full bg-rose-100 px-2.5 py-1">
                <AppText variant="caption" className="font-bold text-rose-900">
                  Extra act slot
                </AppText>
              </View>
            ) : null}
          </View>
          <AppButton
            title={owned ? 'Owned' : 'Buy'}
            variant={owned ? 'secondary' : 'primary'}
            className="mt-3 w-full"
            disabled={owned || busy}
            loading={busy}
            accessibilityLabel={shopItemBuyAccessibilityLabel({ title: item.title, seedCost: item.seedCost, owned })}
            onPress={onBuy}
          />
        </View>
      </View>
    </AppCard>
  );
}

export default function ShopScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const queryClient = useQueryClient();
  const { data: userInfo } = useUserInfoQuery(uid);
  const mergeSettings = useMergeActsSettingsMutation(uid);
  const ensureRosterMutation = useEnsureAssignedTasksMutation(uid);
  const [localError, setLocalError] = useState<string | null>(null);
  const act = useActAppearance();

  const owned = useMemo(() => new Set(userInfo?.ShopPurchasedIds ?? []), [userInfo?.ShopPurchasedIds]);
  const ownedThemes = useMemo(() => ownedTaskThemeSet(userInfo?.ShopPurchasedIds), [userInfo?.ShopPurchasedIds]);
  const actsSettings = useMemo(() => mergeActsDefaults(userInfo?.ActsSettings), [userInfo?.ActsSettings]);
  const equippedTheme = normalizeTaskCheckThemeId(actsSettings.activeTaskCheckTheme);
  const equippedBackdrop = actsSettings.appearanceColorPreset;
  const backdropPresets = useMemo(
    () => selectableAppearancePresets(userInfo?.ShopPurchasedIds),
    [userInfo?.ShopPurchasedIds],
  );

  const purchaseMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!uid) {
        throw new Error('Not signed in.');
      }
      const item = SHOP_ITEMS.find((i) => i.id === itemId);
      if (!item) {
        throw new Error('Unknown item.');
      }
      return purchaseShopItem(uid, {
        id: item.id,
        seedCost: item.seedCost,
        kind: item.kind,
      });
    },
    onMutate: () => setLocalError(null),
    onSuccess: async (res, itemId) => {
      useCurrencyStore.getState().setBalance(res.newHeartPoints);
      await queryClient.invalidateQueries({ queryKey: userInfoQueryKeys.detail(uid!) });
      const item = SHOP_ITEMS.find((i) => i.id === itemId);
      if (item?.kind === 'taskTheme' && item.unlocksThemeId && uid) {
        await mergeSettings.mutateAsync({ activeTaskCheckTheme: item.unlocksThemeId });
        Alert.alert('Unlocked', `${item.title} is now equipped on your task list.`);
      }
      if (item?.kind === 'deedReactionPack' && item.unlocksReactionKinds?.length) {
        const emojis = item.unlocksReactionKinds.map((k) => DEED_REACTION_EMOJI[k]).join(' ');
        Alert.alert('Unlocked!', `New deed feed reactions: ${emojis}`);
      }
      if (item?.kind === 'appearancePreset' && item.unlocksAppearancePresetId && uid) {
        await mergeSettings.mutateAsync({ appearanceColorPreset: item.unlocksAppearancePresetId });
        Alert.alert('New backdrop', `${item.title} is equipped. Change anytime in Settings → Appearance.`);
      }
      if (
        item &&
        (item.kind === 'extraRosterDaily' || item.kind === 'extraRosterWeekly' || item.kind === 'extraRosterMonthly') &&
        uid
      ) {
        await ensureRosterMutation.mutateAsync();
        Alert.alert('Home roster grown', 'Your Tasks list now pulls one more catalog act for that cadence.');
      }
    },
    onError: (e) => setLocalError(mapAuthError(e)),
  });

  const equipTheme = (themeId: TaskCheckThemeId) => {
    if (!uid) {
      return;
    }
    if (themeId !== 'default' && !ownedThemes.has(themeId)) {
      return;
    }
    setLocalError(null);
    void mergeSettings.mutate(
      { activeTaskCheckTheme: themeId },
      {
        onError: (e) => setLocalError(mapAuthError(e)),
      },
    );
  };

  const equipBackdrop = (presetId: ActAppearanceColorPresetId) => {
    if (!uid) {
      return;
    }
    if (!backdropPresets.includes(presetId)) {
      return;
    }
    setLocalError(null);
    void mergeSettings.mutate(
      { appearanceColorPreset: presetId },
      {
        onError: (e) => setLocalError(mapAuthError(e)),
      },
    );
  };

  const renderSection = (sectionId: ShopSectionId) => {
    const meta = SHOP_SECTION_META[sectionId];
    const items = shopItemsForSection(sectionId);
    const showComingSoon = items.length === 0 && sectionId !== 'task_appearance';

    return (
      <View key={sectionId} className="mb-8">
        <TitleWithInfo
          title={meta.title}
          variant="title"
          className="mb-4"
          infoText={meta.blurb}
        />

        {sectionId === 'app_appearance' ? (
          <AppCard className="mb-4 border-acts-blue/25 bg-acts-blue-soft/50 p-4">
            <TitleWithInfo
              title="Equipped app backdrop"
              className="mb-3"
              infoText="Tap a color theme you own. Blossom, Evergreen, Ocean, and Dawn are always free."
            />
            <View className="flex-row flex-wrap gap-2">
              {backdropPresets.map((pid) => {
                const pal = resolveActAppearancePalette(pid);
                const active = equippedBackdrop === pid;
                return (
                  <Pressable
                    key={pid}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: mergeSettings.isPending }}
                    accessibilityLabel={equipChipAccessibilityLabel(ACT_APPEARANCE_PRESET_LABELS[pid], {
                      selected: active,
                      kind: 'app backdrop',
                    })}
                    disabled={mergeSettings.isPending}
                    onPress={() => equipBackdrop(pid)}
                    className="min-w-[47%] flex-1 flex-row items-center gap-2 rounded-2xl border px-3 py-2"
                    style={appearancePresetChipStyle(pal, active)}>
                    <View className="flex-row gap-1">
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: pal.green }} />
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: pal.blue }} />
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: pal.canvas }} />
                    </View>
                    <Text
                      allowFontScaling
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: active ? '700' : '600',
                        color: active ? '#FFFFFF' : pal.ink,
                      }}
                      maxFontSizeMultiplier={act.maxFontSizeMultiplier}>
                      {ACT_APPEARANCE_PRESET_LABELS[pid]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>
        ) : null}

        {sectionId === 'task_appearance' ? (
          <AppCard className="mb-4 border-acts-blue/25 bg-acts-blue-soft/50 p-4">
            <TitleWithInfo
              title="Equipped task look"
              className="mb-3"
              infoText="Tap a style you own. Classic is always free."
            />
            <View className="flex-row flex-wrap gap-2">
              {TASK_CHECK_THEME_LIST.map((tid) => {
                const tm = TASK_CHECK_THEMES[tid];
                const unlocked = tid === 'default' || ownedThemes.has(tid);
                const active = (tid === 'default' && equippedTheme === 'default') || equippedTheme === tid;
                return (
                  <Pressable
                    key={tid}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: !unlocked || mergeSettings.isPending }}
                    accessibilityLabel={equipChipAccessibilityLabel(tm.label, {
                      selected: active,
                      locked: !unlocked,
                      kind: 'task look',
                    })}
                    disabled={!unlocked || mergeSettings.isPending}
                    onPress={() => equipTheme(tid)}
                    className={`flex-row items-center gap-2 rounded-2xl border px-3 py-2 ${
                      unlocked ? '' : 'opacity-50'
                    }`}
                    style={unlocked ? filterChipStyle(act.palette, active) : filterChipStyle(act.palette, false)}>
                    <Ionicons name={tm.ion} size={18} color={unlocked ? act.palette.ink : act.palette.muted} />
                    <AppText variant="caption" className={`font-semibold ${unlocked ? 'text-acts-ink' : 'text-acts-muted'}`}>
                      {tm.label}
                      {!unlocked ? ' · locked' : ''}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>
        ) : null}

        {showComingSoon ? (
          <AppCard className="border-dashed border-acts-border/80 bg-acts-canvas/80 p-4">
            <AppText variant="body" className="text-center text-acts-muted">
              Coming soon - new goodies will land in this aisle.
            </AppText>
          </AppCard>
        ) : null}

        {items.map((item) => (
          <LootRow
            key={item.id}
            item={item}
            act={act}
            owned={owned.has(item.id)}
            busy={purchaseMutation.isPending && purchaseMutation.variables === item.id}
            onBuy={() => {
              setLocalError(null);
              Alert.alert(
                'Confirm purchase',
                `Spend ${item.seedCost} seeds on ${item.title}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Buy',
                    onPress: () => purchaseMutation.mutate(item.id),
                  },
                ],
              );
            }}
          />
        ))}
      </View>
    );
  };

  if (!uid) {
    return (
      <Screen scroll>
        <AppText variant="body" className="text-acts-muted">
          Sign in to open Rewards.
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="pb-8 pt-2">
        <View className="mb-6 flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-2xl border-2 border-acts-green/40 bg-acts-green-soft">
            <Ionicons name="gift-outline" size={28} color={act.palette.green} />
          </View>
          <View className="min-w-0 flex-1">
            <AppText variant="title" className="text-acts-ink">
              Rewards
            </AppText>
            <AppText variant="caption" className="text-acts-muted">
              Spend seeds you earn from acts. Open Rewards anytime from the Tasks header.
            </AppText>
          </View>
        </View>

        {localError ? (
          <AppText variant="caption" className="mb-4 text-acts-danger">
            {localError}
          </AppText>
        ) : null}

        <RewardedAdsSectionGate userInfo={userInfo ?? undefined} />

        {SHOP_SECTION_ORDER.map(renderSection)}
      </View>
    </Screen>
  );
}
