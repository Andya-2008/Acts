import { View } from 'react-native';

import { HeaderBackLabel } from '@/shared/components/HeaderBackLabel';
import { ScreenTopSafeArea } from '@/shared/components/ScreenTopSafeArea';
import { AppText } from '@/shared/components/ui';

/** In-screen header for Deed Feed → Friends (replaces native stack header). */
export function DeedFeedFriendsTopBar() {
  return (
    <ScreenTopSafeArea barClassName="border-b border-acts-border/60">
      <View className="h-12 flex-row items-center px-2">
        <View className="z-10 min-w-[88px]">
          <HeaderBackLabel fallbackHref="/(app)/(tabs)/deed-feed" />
        </View>
        <AppText
          variant="title"
          pointerEvents="none"
          className="absolute inset-x-0 text-center text-acts-ink"
          numberOfLines={1}>
          Friends
        </AppText>
      </View>
    </ScreenTopSafeArea>
  );
}
