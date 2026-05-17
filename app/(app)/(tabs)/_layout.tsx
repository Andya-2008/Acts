import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, TabList, TabTrigger } from 'expo-router/ui';
import { useSegments } from 'expo-router';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useHeartPointsFirestoreSync } from '@/features/user-profile/hooks/useHeartPointsFirestoreSync';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { SwipeableTabSlot } from '@/shared/components/SwipeableTabSlot';
import { AppText } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

const TAB_NAMES = ['tasks', 'deed-feed', 'profile'] as const;
type MainTabName = (typeof TAB_NAMES)[number];

function useMainTabRoute(): MainTabName {
  const segments = useSegments() as string[];
  return useMemo(() => {
    for (const name of TAB_NAMES) {
      if (segments.includes(name)) return name;
    }
    return 'tasks';
  }, [segments]);
}

export default function TabsLayout() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const act = useActAppearance();
  useHeartPointsFirestoreSync(uid, userInfo);
  const insets = useSafeAreaInsets();
  const mainTab = useMainTabRoute();

  const tabActive = act.palette.green;
  const tabInactive = act.palette.muted;

  const tabBarPadBottom = Math.max(insets.bottom, 8);
  const tabBarHeight = Platform.OS === 'ios' ? 52 + tabBarPadBottom : 48 + tabBarPadBottom;

  return (
    <Tabs>
      <SwipeableTabSlot />
      <TabList
        style={[
          styles.tabList,
          {
            paddingBottom: tabBarPadBottom,
            paddingTop: Platform.OS === 'ios' ? 4 : 0,
            minHeight: tabBarHeight,
            backgroundColor: act.palette.surface,
            borderTopColor: act.palette.border,
          },
        ]}>
        <TabTrigger name="tasks" href="/(app)/(tabs)/tasks" asChild>
          <Pressable style={styles.tabCell} accessibilityRole="tab" accessibilityState={{ selected: mainTab === 'tasks' }}>
            <View style={styles.tabInner}>
              <Ionicons
                name="leaf-outline"
                size={24}
                color={mainTab === 'tasks' ? tabActive : tabInactive}
                style={Platform.OS === 'android' ? { marginBottom: 2 } : undefined}
              />
              <AppText
                variant="label"
                className="text-[11px] font-semibold"
                style={{ color: mainTab === 'tasks' ? tabActive : tabInactive }}>
                Tasks
              </AppText>
            </View>
          </Pressable>
        </TabTrigger>
        <TabTrigger name="deed-feed" href="/(app)/(tabs)/deed-feed" asChild>
          <Pressable
            style={styles.tabCell}
            accessibilityRole="tab"
            accessibilityState={{ selected: mainTab === 'deed-feed' }}>
            <View style={styles.tabInner}>
              <Ionicons
                name="images-outline"
                size={24}
                color={mainTab === 'deed-feed' ? tabActive : tabInactive}
                style={Platform.OS === 'android' ? { marginBottom: 2 } : undefined}
              />
              <AppText
                variant="label"
                className="text-[11px] font-semibold"
                style={{ color: mainTab === 'deed-feed' ? tabActive : tabInactive }}>
                Deed Feed
              </AppText>
            </View>
          </Pressable>
        </TabTrigger>
        <TabTrigger name="profile" href="/(app)/(tabs)/profile" asChild>
          <Pressable style={styles.tabCell} accessibilityRole="tab" accessibilityState={{ selected: mainTab === 'profile' }}>
            <View style={styles.tabInner}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color={mainTab === 'profile' ? tabActive : tabInactive}
                style={Platform.OS === 'android' ? { marginBottom: 2 } : undefined}
              />
              <AppText
                variant="label"
                className="text-[11px] font-semibold"
                style={{ color: mainTab === 'profile' ? tabActive : tabInactive }}>
                Profile
              </AppText>
            </View>
          </Pressable>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  /** Stack label under icon regardless of TabTrigger’s default row layout. */
  tabInner: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
