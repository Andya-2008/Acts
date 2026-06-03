import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Pressable } from 'react-native';

import { AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

type HeaderBackLabelProps = {
  /** When the stack cannot go back, navigate here instead of Tasks. */
  fallbackHref?: Href;
};

/** Stack header control: chevron + “Back” (avoids iOS showing parent route name like “index”). */
export function HeaderBackLabel({ fallbackHref = '/(app)/(tabs)/tasks' as Href }: HeaderBackLabelProps) {
  const act = useActAppearance();
  const ink = act.palette.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={12}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace(fallbackHref);
        }
      }}
      className="flex-row items-center rounded-lg py-1 pr-1 active:opacity-70"
      style={{ minHeight: 44, justifyContent: 'center' }}>
      <Ionicons name="chevron-back" size={24} color={ink} />
      <AppText variant="subtitle" style={{ color: ink }} className="-ml-1">
        Back
      </AppText>
    </Pressable>
  );
}
