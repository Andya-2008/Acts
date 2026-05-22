import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Pressable } from 'react-native';

import { AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

/** Stack header control: chevron + “Back” (avoids iOS showing parent route name like “tabs”). */
export function HeaderBackLabel() {
  const act = useActAppearance();
  const ink = act.palette.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={10}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(app)/(tabs)/tasks' as Href);
        }
      }}
      className="flex-row items-center py-1 pr-1 active:opacity-70">
      <Ionicons name="chevron-back" size={24} color={ink} />
      <AppText variant="subtitle" style={{ color: ink }} className="-ml-1">
        Back
      </AppText>
    </Pressable>
  );
}
