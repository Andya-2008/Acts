import { Stack } from 'expo-router';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

export default function ProfileStackLayout() {
  const act = useActAppearance();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: act.palette.ink,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: act.palette.canvas },
        headerBackTitle: '',
        title: 'Profile',
      }}
    />
  );
}
