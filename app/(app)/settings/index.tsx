import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { AppButton, Screen } from '@/shared/components/ui';

const items: { title: string; href: string }[] = [
  { title: 'Account', href: '/(app)/settings/account' },
  { title: 'Personalization', href: '/(app)/settings/personalization' },
  { title: 'Appearance', href: '/(app)/settings/appearance' },
  { title: 'Preferences', href: '/(app)/settings/preferences' },
  { title: 'Privacy', href: '/(app)/settings/privacy' },
  { title: 'Notifications', href: '/(app)/settings/notifications' },
  { title: 'Photos', href: '/(app)/settings/photos' },
  { title: 'About', href: '/(app)/settings/about' },
];

export default function SettingsIndexScreen() {
  return (
    <Screen scroll>
      <View className="pt-2 pb-8">
        {items.map((it) => (
          <AppButton
            key={it.title}
            title={it.title}
            variant="secondary"
            className="mb-2.5 w-full"
            onPress={() => router.push(it.href as Href)}
          />
        ))}
      </View>
    </Screen>
  );
}
