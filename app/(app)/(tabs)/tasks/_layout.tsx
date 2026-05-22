import { Link, Stack, usePathname, useSegments } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SeedsXpShopHeader } from '@/shared/components/SeedsXpShopHeader';
import { AppText } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

export default function TasksTabLayout() {
  const act = useActAppearance();
  const pathname = usePathname();
  const isMemories = pathname.includes('memories');
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];
  const headerTitle = useMemo(() => {
    const i = segments.lastIndexOf('tasks');
    return i >= 0 && segments[i + 1] === 'memories' ? 'Memories' : 'Tasks';
  }, [segments]);

  return (
    <View className="flex-1 bg-acts-canvas">
      <View style={{ paddingTop: insets.top, backgroundColor: act.palette.canvas }}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
          <AppText variant="title" className="flex-1 text-acts-ink" numberOfLines={1}>
            {headerTitle}
          </AppText>
          <SeedsXpShopHeader />
        </View>
      </View>
      <View className="flex-row gap-2 border-b border-acts-border bg-acts-canvas px-4 py-2">
        <Link href="/tasks" asChild replace>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: !isMemories }}
            className={`mx-0.5 flex-1 items-center overflow-visible rounded-2xl py-2.5 ${!isMemories ? 'bg-acts-green-soft' : 'bg-transparent'}`}>
            <AppText variant="subtitle" className={!isMemories ? 'font-semibold text-acts-green' : 'text-acts-muted'}>
              Tasks
            </AppText>
          </Pressable>
        </Link>
        <Link href="/tasks/memories" asChild replace>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isMemories }}
            className={`mx-0.5 flex-1 items-center overflow-visible rounded-2xl py-2.5 ${isMemories ? 'bg-acts-green-soft' : 'bg-transparent'}`}>
            <AppText variant="subtitle" className={isMemories ? 'font-semibold text-acts-green' : 'text-acts-muted'}>
              Memories
            </AppText>
          </Pressable>
        </Link>
      </View>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="memories" />
      </Stack>
    </View>
  );
}
