import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Platform, Pressable } from 'react-native';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

type IoniconName = NonNullable<ComponentProps<typeof Ionicons>['name']>;

export type HeaderIconButtonProps = {
  name: IoniconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** Header chrome for icon actions (matches settings / stack back pressables). */
export function HeaderIconButton({
  name,
  onPress,
  accessibilityLabel,
  size = 24,
  className = '',
  style,
}: HeaderIconButtonProps) {
  const act = useActAppearance();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={12}
      onPress={onPress}
      className={`rounded-lg p-1 active:opacity-70 ${className}`.trim()}
      style={[
        { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}>
      <Ionicons
        name={name}
        size={size}
        color={act.palette.ink}
        style={Platform.OS === 'android' ? { includeFontPadding: false } : undefined}
      />
    </Pressable>
  );
}

export function HeaderBackIconButton({
  onPress,
  accessibilityLabel = 'Back',
  size = 28,
}: {
  onPress: () => void;
  accessibilityLabel?: string;
  size?: number;
}) {
  return (
    <HeaderIconButton
      name="chevron-back"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      size={size}
      className="-ml-1"
    />
  );
}
