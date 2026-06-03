import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  /**
   * Safe-area edges for the screen wrapper. Omit `top` when a child uses `ScreenTopSafeArea`.
   */
  safeAreaEdges?: readonly Edge[];
  /**
   * Merged into `ScrollView` `contentContainerStyle` when `scroll` is true.
   * Use `{ justifyContent: 'center' }` for short forms (e.g. sign-in) so content is not stuck at the top.
   */
  scrollContentContainerStyle?: StyleProp<ViewStyle>;
};

const DEFAULT_SAFE_AREA_EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];

export function Screen({
  children,
  scroll = false,
  className,
  safeAreaEdges = DEFAULT_SAFE_AREA_EDGES,
  scrollContentContainerStyle,
}: ScreenProps) {
  const act = useActAppearance();
  const scrollPadding = {
    paddingHorizontal: act.screenPaddingHorizontal,
    paddingBottom: 32,
    paddingTop: 8,
    width: '100%' as const,
  };

  const body = scroll ? (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[{ flexGrow: 1, ...scrollPadding }, scrollContentContainerStyle]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View
      className="flex-1 pb-8 pt-2"
      style={{ paddingHorizontal: act.screenPaddingHorizontal }}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={safeAreaEdges}
      style={{ flex: 1, backgroundColor: act.palette.canvas }}
      className={`flex-1 ${className ?? ''}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
