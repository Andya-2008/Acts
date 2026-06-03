import { Stack } from 'expo-router';

import { stackHeaderChrome } from '@/shared/navigation/stackHeaderChrome';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

export default function ProfileStackLayout() {
  const act = useActAppearance();

  return (
    <Stack screenOptions={{ ...stackHeaderChrome(act), headerShown: true, title: 'Profile' }} />
  );
}
