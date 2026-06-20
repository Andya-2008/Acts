import { View } from 'react-native';

import { AppText } from '@/shared/components/ui';

type NotificationBadgeProps = {
  count: number;
  /** `tab` sits on a tab icon; `bell` matches the deed-feed header bell. */
  variant?: 'tab' | 'bell';
};

/** Unread activity count pill — shared by tab bar and header bell. */
export function NotificationBadge({ count, variant = 'bell' }: NotificationBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const label = count > 9 ? '9+' : String(count);
  const isTab = variant === 'tab';

  return (
    <View
      pointerEvents="none"
      className={
        isTab
          ? 'absolute -right-2 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-acts-surface bg-acts-green px-1'
          : 'absolute -right-0.5 -top-0.5 h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-acts-canvas bg-acts-green px-1'
      }>
      <AppText
        variant="caption"
        className={`font-bold leading-none text-white ${isTab ? 'text-[9px]' : 'text-[10px]'}`}>
        {label}
      </AppText>
    </View>
  );
}
