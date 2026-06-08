import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';

import {
  mapRewardedAdError,
} from '@/features/rewarded-ads/rewardedAdApi';
import {
  buildRewardedAdOffers,
  lockedAppearanceShopItems,
  type RewardedAdOffer,
  type RewardedAdRewardType,
} from '@/features/rewarded-ads/rewardedAdOffers';
import { useRewardedAdPlayer } from '@/features/rewarded-ads/useRewardedAdPlayer';
import { rewardedAdsEnabled } from '@/features/rewarded-ads/rewardedAdConfig';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { AppButton, AppCard, AppText, TitleWithInfo } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { ACT_APPEARANCE_PRESET_LABELS, resolveActAppearancePalette } from '@/shared/theme/appearancePalettes';
import { appearanceTrialRemainingLabel } from '@/shared/utils/appearanceTrial';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import type { ShopItem } from '@/features/shop/shopCatalog';
import { useAuthStore } from '@/shared/stores/authStore';
import type { UserInfoRead } from '@/shared/types/userInfo';

type RewardedAdsSectionProps = {
  userInfo: UserInfoRead | undefined;
};

function OfferRow({
  offer,
  busy,
  onPress,
  act,
}: {
  offer: RewardedAdOffer;
  busy: boolean;
  onPress: () => void;
  act: ReturnType<typeof useActAppearance>;
}) {
  return (
    <AppCard className="mb-3 border-acts-border/80 p-4">
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-xl bg-acts-green-soft">
          <Ionicons name="play-circle-outline" size={22} color={act.palette.green} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText variant="subtitle" className="text-acts-ink">
            {offer.title}
          </AppText>
          <AppText variant="caption" className="mt-1 text-acts-muted">
            {offer.description}
          </AppText>
          {!offer.available && offer.unavailableReason ? (
            <AppText variant="caption" className="mt-2 text-acts-muted">
              {offer.unavailableReason}
            </AppText>
          ) : null}
          <AppButton
            title={offer.available ? 'Watch ad' : 'Unavailable'}
            variant={offer.available ? 'secondary' : 'ghost'}
            className="mt-3 self-start px-5"
            disabled={!offer.available || busy}
            loading={busy}
            onPress={onPress}
          />
        </View>
      </View>
    </AppCard>
  );
}

export function RewardedAdsSection({ userInfo }: RewardedAdsSectionProps) {
  const uid = useAuthStore((s) => s.user?.uid);
  const queryClient = useQueryClient();
  const act = useActAppearance();
  const { showAdForReward, loading, supported } = useRewardedAdPlayer();
  const [pendingType, setPendingType] = useState<RewardedAdRewardType | null>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const acts = useMemo(() => mergeActsDefaults(userInfo?.ActsSettings), [userInfo?.ActsSettings]);
  const offers = useMemo(
    () => buildRewardedAdOffers(acts, userInfo?.ShopPurchasedIds),
    [acts, userInfo?.ShopPurchasedIds],
  );
  const lockedThemes = useMemo(
    () => lockedAppearanceShopItems(userInfo?.ShopPurchasedIds),
    [userInfo?.ShopPurchasedIds],
  );
  const trialLabel = appearanceTrialRemainingLabel(acts);

  const refreshProfile = async () => {
    if (uid) {
      await queryClient.invalidateQueries({ queryKey: userInfoQueryKeys.detail(uid) });
    }
  };

  const runReward = async (rewardType: RewardedAdRewardType, themeShopItemId?: string) => {
    setLocalError(null);
    setPendingType(rewardType);
    try {
      await showAdForReward(rewardType, themeShopItemId);
      await refreshProfile();
      if (rewardType === 'streak_grace') {
        Alert.alert('Bonus streak save banked', 'Use it from Tasks when your streak needs saving.');
      } else if (rewardType === 'theme_trial') {
        Alert.alert('Backdrop trial started', 'Your preview lasts 24 hours.');
      } else {
        Alert.alert('Weekend extended', 'Double seeds and XP continue through Monday night.');
      }
    } catch (e) {
      setLocalError(mapRewardedAdError(e));
    } finally {
      setPendingType(null);
    }
  };

  const onOfferPress = (offer: RewardedAdOffer) => {
    if (!offer.available) {
      return;
    }
    if (offer.type === 'theme_trial') {
      setThemePickerOpen(true);
      return;
    }
    void runReward(offer.type);
  };

  const onPickTheme = (item: ShopItem) => {
    setThemePickerOpen(false);
    void runReward('theme_trial', item.id);
  };

  if (!supported || !rewardedAdsEnabled()) {
    return null;
  }

  return (
    <>
      <View className="mb-8">
        <TitleWithInfo
          title="Optional ad rewards"
          variant="title"
          className="mb-2"
          infoText="Watch a short ad to unlock optional bonuses. Acts stays free — these are never required."
        />
        <AppText variant="caption" className="mb-4 text-acts-muted">
          Limits apply so rewards stay fair. {trialLabel ? `${trialLabel}.` : ''}
          {Math.max(0, Math.floor(Number(acts.streakGraceBonusCredits ?? 0))) > 0
            ? ' You have a bonus streak save banked.'
            : ''}
        </AppText>

        {localError ? (
          <AppText variant="caption" className="mb-3 text-acts-danger">
            {localError}
          </AppText>
        ) : null}

        {offers.map((offer) => (
          <OfferRow
            key={offer.type}
            offer={offer}
            act={act}
            busy={loading && pendingType === offer.type}
            onPress={() => onOfferPress(offer)}
          />
        ))}
      </View>

      <Modal visible={themePickerOpen} transparent animationType="fade" onRequestClose={() => setThemePickerOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/45" onPress={() => setThemePickerOpen(false)}>
          <Pressable className="max-h-[70%] rounded-t-3xl bg-acts-surface px-5 pb-8 pt-5" onPress={() => undefined}>
            <AppText variant="title" className="mb-2 text-acts-ink">
              Pick a backdrop to preview
            </AppText>
            <AppText variant="caption" className="mb-4 text-acts-muted">
              After the ad, you can use this premium backdrop for 24 hours.
            </AppText>
            {lockedThemes.map((item) => {
              const presetId = item.unlocksAppearancePresetId!;
              const pal = resolveActAppearancePalette(presetId);
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => onPickTheme(item)}
                  className="mb-2 flex-row items-center gap-3 rounded-2xl border border-acts-border px-4 py-3 active:opacity-80">
                  <View className="flex-row gap-1">
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: pal.green }} />
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: pal.blue }} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <AppText variant="subtitle" className="text-acts-ink">
                      {ACT_APPEARANCE_PRESET_LABELS[presetId]}
                    </AppText>
                    <AppText variant="caption" className="text-acts-muted">
                      {item.title}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
            <AppButton title="Cancel" variant="ghost" className="mt-2" onPress={() => setThemePickerOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
