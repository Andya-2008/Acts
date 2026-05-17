import { View } from 'react-native';

import { AppCard, AppText } from '@/shared/components/ui';

export default function BecomeScreen() {
  return (
    <View className="flex-1 justify-center bg-acts-canvas px-5 pb-8 pt-2">
      <AppText variant="title" className="mb-4">
        Become
      </AppText>
      <AppCard>
        <AppText variant="body">Coming soon.</AppText>
      </AppCard>
    </View>
  );
}
