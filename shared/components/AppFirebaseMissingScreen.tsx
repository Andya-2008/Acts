import { Linking, Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { listMissingFirebaseEnvVars } from '@/shared/config/env';
import { Screen } from '@/shared/components/ui/Screen';

const FIREBASE_CONSOLE = 'https://console.firebase.google.com/';

export function AppFirebaseMissingScreen() {
  const missing = listMissingFirebaseEnvVars();

  return (
    <Screen scroll>
      <View className="flex-1 justify-center py-10">
        <AppText variant="title" className="mb-3">
          Firebase env incomplete
        </AppText>
        <AppText variant="body" className="mb-4">
          Add the missing <AppText variant="body" className="font-semibold">EXPO_PUBLIC_*</AppText> keys to{' '}
          <AppText variant="body" className="font-semibold">
            .env
          </AppText>{' '}
          and restart Expo.
        </AppText>

        {missing.length > 0 ? (
          <View className="mb-6 rounded-2xl border border-acts-border bg-acts-surface p-4">
            <AppText variant="label" className="mb-2">
              Still missing or empty
            </AppText>
            {missing.map((name) => (
              <AppText key={name} variant="caption" className="mb-1 font-mono text-acts-ink">
                {name}
              </AppText>
            ))}
          </View>
        ) : null}

        <Pressable onPress={() => void Linking.openURL(FIREBASE_CONSOLE)} className="mb-4 self-start">
          <AppText variant="caption" className="text-acts-blue underline">
            Open Firebase Console
          </AppText>
        </Pressable>

        <AppText variant="caption" className="text-acts-muted">
          Firebase → Project settings → Your apps → Web.
        </AppText>
      </View>
    </Screen>
  );
}
