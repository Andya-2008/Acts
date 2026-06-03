import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

type ScreenTopSafeAreaProps = {
  children: ReactNode;
  className?: string;
  barClassName?: string;
  style?: StyleProp<ViewStyle>;
};

/** Top inset for in-screen headers (status bar / notch). Use with `Screen` `safeAreaEdges` without `top`. */
export function ScreenTopSafeArea({ children, className, barClassName, style }: ScreenTopSafeAreaProps) {
  const act = useActAppearance();

  return (
    <SafeAreaView
      edges={['top']}
      className={className}
      style={[{ backgroundColor: act.palette.canvas }, style]}>
      <View className={barClassName}>{children}</View>
    </SafeAreaView>
  );
}
