import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

type AppCardProps = {
  children: ReactNode;
  className?: string;
  /** When set, overrides the default surface background (e.g. deed feed card tints). */
  cardBackgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppCard({ children, className, cardBackgroundColor, style }: AppCardProps) {
  const act = useActAppearance();
  const bg = cardBackgroundColor ?? act.palette.surface;
  const border = `${act.palette.border}99`;

  return (
    <View
      style={[{ backgroundColor: bg, borderColor: border }, style]}
      className={`rounded-3xl border p-5 shadow-card ${className ?? ''}`}>
      {children}
    </View>
  );
}
