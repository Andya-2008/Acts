import type { PressableProps } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dangerOutline';

const layoutClass =
  'relative overflow-hidden items-center justify-center rounded-2xl px-4 py-3.5 min-h-[52px] shadow-sm active:opacity-90';

export type AppButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

export function AppButton({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  style,
  ...rest
}: AppButtonProps) {
  const act = useActAppearance();
  const isDisabled = disabled || loading;

  const pressStyle =
    variant === 'primary'
      ? {
          backgroundColor: act.palette.green,
          borderColor: act.palette.green,
          borderWidth: 1,
        }
      : variant === 'secondary'
        ? {
            backgroundColor: act.palette.blueSoft,
            borderColor: act.palette.blue,
            borderWidth: 1.5,
          }
        : variant === 'dangerOutline'
          ? {
              backgroundColor: act.palette.surface,
              borderColor: act.palette.danger,
              borderWidth: 2,
            }
          : {
              backgroundColor: act.palette.surface,
              borderColor: act.palette.green,
              borderWidth: 2,
            };

  const labelColor =
    variant === 'primary'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? act.palette.ink
        : variant === 'dangerOutline'
          ? act.palette.danger
          : act.palette.green;

  const spinnerColor =
    variant === 'primary'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? act.palette.green
        : variant === 'dangerOutline'
          ? act.palette.danger
          : act.palette.green;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`${layoutClass} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      style={(state) => {
        const user = typeof style === 'function' ? style(state) : style;
        return user ?? undefined;
      }}
      {...rest}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, pressStyle]} />
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          style={{
            color: labelColor,
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
          }}
          maxFontSizeMultiplier={act.maxFontSizeMultiplier}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
