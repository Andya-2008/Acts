import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui';

type DeedShareNudgeBannerProps = {
  rewardLabel: string;
  onDismiss: () => void;
};

export function DeedShareNudgeBanner({ rewardLabel, onDismiss }: DeedShareNudgeBannerProps) {
  return (
    <View className="mb-3 rounded-2xl border border-acts-blue/35 bg-acts-blue-soft/80 p-3">
      <View className="mb-2 flex-row items-start">
        <View className="mr-2.5 mt-0.5 h-9 w-9 items-center justify-center rounded-xl bg-acts-surface">
          <Ionicons name="paper-plane" size={18} color="#5B6BE8" />
        </View>
        <View className="min-w-0 flex-1">
          <AppText variant="subtitle" className="text-acts-ink">
            Share your good deed?
          </AppText>
          <AppText variant="caption" className="mt-1 leading-5 text-acts-muted">
            Add a quick photo below, then share to the deed feed for {rewardLabel}.
          </AppText>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss deed feed share tip"
        onPress={onDismiss}
        className="self-start rounded-full px-2 py-1 active:opacity-80">
        <AppText variant="caption" className="font-semibold text-acts-blue">
          Not now
        </AppText>
      </Pressable>
    </View>
  );
}
