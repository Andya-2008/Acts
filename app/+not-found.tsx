import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { AppText, Screen } from '@/shared/components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <AppText variant="title" className="mb-3 text-center">
            This screen does not exist.
          </AppText>
          <Link href="/">
            <AppText variant="caption" className="text-acts-blue">
              Go to home
            </AppText>
          </Link>
        </View>
      </Screen>
    </>
  );
}
