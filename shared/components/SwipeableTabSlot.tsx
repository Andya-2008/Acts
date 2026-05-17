import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { TabContext } from 'expo-router/build/ui/TabContext';
import { TabSlot } from 'expo-router/ui';
import { useNavigatorContext } from 'expo-router/build/views/Navigator';

/** Left-to-right swipe order; must match bottom tab order. */
export const SWIPE_TAB_ORDER = ['tasks', 'deed-feed', 'profile'] as const;

export type SwipeTabName = (typeof SWIPE_TAB_ORDER)[number];

function swipeIndexForRouteName(name: string | undefined): number {
  if (!name) return 0;
  const i = SWIPE_TAB_ORDER.indexOf(name as SwipeTabName);
  return i >= 0 ? i : 0;
}

function SwipeableTabSlotNative() {
  const { state, descriptors, navigation } = useNavigatorContext();
  const pagerRef = useRef<PagerView>(null);
  const suppressPageSelected = useRef(false);
  const lastSwipeIndex = useRef(swipeIndexForRouteName(state.routes[state.index]?.name));

  const focusedName = state.routes[state.index]?.name;

  useEffect(() => {
    const navIdx = swipeIndexForRouteName(focusedName);
    if (navIdx === lastSwipeIndex.current) return;
    suppressPageSelected.current = true;
    pagerRef.current?.setPage(navIdx);
  }, [focusedName]);

  const pages = useMemo(() => {
    return SWIPE_TAB_ORDER.map((routeName) => {
      const route = state.routes.find((r) => r.name === routeName);
      if (!route) {
        return { routeName, descriptor: null as null, routeKey: routeName };
      }
      const descriptor = descriptors[route.key];
      return { routeName, descriptor, routeKey: route.key };
    });
  }, [state.routes, descriptors]);

  const onPageSelected = (e: { nativeEvent: { position: number } }) => {
    const pos = e.nativeEvent.position;
    if (suppressPageSelected.current) {
      suppressPageSelected.current = false;
      lastSwipeIndex.current = pos;
      return;
    }
    lastSwipeIndex.current = pos;
    const name = SWIPE_TAB_ORDER[pos];
    if (name && name !== focusedName) {
      navigation.navigate(name as never);
    }
  };

  return (
    <PagerView
      ref={pagerRef}
      style={styles.pager}
      initialPage={lastSwipeIndex.current}
      onPageSelected={onPageSelected}
      overdrag>
      {pages.map(({ routeName, descriptor, routeKey }) => {
        if (!descriptor) {
          return <View key={routeKey} style={styles.page} />;
        }
        return (
          <View key={descriptor.route.key} style={styles.page} collapsable={false}>
            <TabContext.Provider value={descriptor.options}>{descriptor.render()}</TabContext.Provider>
          </View>
        );
      })}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pager: { flex: 1 },
  page: { flex: 1 },
});

export function SwipeableTabSlot() {
  if (Platform.OS === 'web') {
    return <TabSlot />;
  }
  return <SwipeableTabSlotNative />;
}
