import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { Pressable } from 'react-native';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

function SettingsRootBackButton() {
  const act = useActAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={12}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(app)/(tabs)/profile');
        }
      }}
      className="-ml-1 rounded-lg p-1 active:opacity-70">
      <Ionicons name="chevron-back" size={28} color={act.palette.ink} />
    </Pressable>
  );
}

function SettingsChildBackButton() {
  const act = useActAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={12}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(app)/settings');
        }
      }}
      className="-ml-1 rounded-lg p-1 active:opacity-70">
      <Ionicons name="chevron-back" size={28} color={act.palette.ink} />
    </Pressable>
  );
}

export default function SettingsLayout() {
  const act = useActAppearance();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: act.palette.ink,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: act.palette.canvas },
        headerBackTitle: '',
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerLeft: () => <SettingsRootBackButton />,
        }}
      />
      <Stack.Screen name="account" options={{ title: 'Account Info' }} />
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
