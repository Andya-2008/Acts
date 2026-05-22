import { View } from 'react-native';

import { AppText } from '@/shared/components/ui';

export function AuthMethodDivider({ label = 'or' }: { label?: string }) {
  return (
    <View className="my-5 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-acts-border" />
      <AppText variant="caption" className="text-acts-muted">
        {label}
      </AppText>
      <View className="h-px flex-1 bg-acts-border" />
    </View>
  );
}
