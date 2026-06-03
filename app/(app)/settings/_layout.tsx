import { Stack, router } from 'expo-router';

import { HeaderBackIconButton } from '@/shared/components/HeaderIconButton';
import { stackHeaderChrome } from '@/shared/navigation/stackHeaderChrome';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

function SettingsRootBackButton() {
  return (
    <HeaderBackIconButton
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(app)/(tabs)/profile');
        }
      }}
    />
  );
}

function SettingsChildBackButton() {
  return (
    <HeaderBackIconButton
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(app)/settings');
        }
      }}
    />
  );
}

export default function SettingsLayout() {
  const act = useActAppearance();

  return (
    <Stack screenOptions={{ ...stackHeaderChrome(act), headerShown: true }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerLeft: () => <SettingsRootBackButton />,
        }}
      />
      <Stack.Screen name="account" options={{ title: 'Account Info' }} />
      <Stack.Screen
        name="personalization"
        options={{
          title: 'Personalization',
          headerLeft: () => <SettingsChildBackButton />,
        }}
      />
      <Stack.Screen
        name="appearance"
        options={{
          title: 'Appearance',
          headerLeft: () => <SettingsChildBackButton />,
        }}
      />
      <Stack.Screen name="preferences" options={{ title: 'Preferences' }} />
      <Stack.Screen
        name="privacy"
        options={{
          title: 'Privacy',
          headerLeft: () => <SettingsChildBackButton />,
        }}
      />
      <Stack.Screen name="notifications" options={{ title: 'Notifications', headerLeft: () => <SettingsChildBackButton /> }} />
      <Stack.Screen name="photos" options={{ title: 'Photos' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}
