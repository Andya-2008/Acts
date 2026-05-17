import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { AppText, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';
import { actsTheme } from '@/shared/theme/actsTheme';

export default function Index() {
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);

  if (!authReady) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <ActivityIndicator size="large" color={actsTheme.colors.green} />
          <AppText variant="caption" className="text-center text-acts-muted">
            Checking your session…
          </AppText>
        </View>
      </Screen>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)" />;
}
