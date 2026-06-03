import type { PressableProps } from 'react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dangerOutline';

/** Match `rounded-2xl` in tailwind.config (1rem) so corners are never clipped by a separate underlay layer. */
const RADIUS = 16;

/** Outer pressable stays chrome-free so borders/shadows do not stack with the inner fill. */
const pressableChromeClass = 'rounded-2xl active:opacity-90';

export type AppButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  /** `compact` fits list rows (friend requests, contact add). */
  size?: 'default' | 'compact';
  loading?: boolean;
};

export function AppButton({
  title,
  variant = 'primary',
  size = 'default',
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

  const compact = size === 'compact';
  const innerFillStyle = {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: compact ? 40 : 52,
    paddingVertical: compact ? 8 : 14,
    paddingHorizontal: compact ? 12 : 16,
    width: '100%' as const,
    borderRadius: RADIUS,
    ...pressStyle,
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`${pressableChromeClass} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      style={(state) => {
        const user = typeof style === 'function' ? style(state) : style;
        return [user ?? undefined, { borderRadius: RADIUS, overflow: 'hidden' as const, backgroundColor: 'transparent' }];
      }}
      {...rest}>
      <View style={innerFillStyle} collapsable={false}>
        {loading ? (
          <ActivityIndicator color={spinnerColor} />
        ) : (
          <Text
            allowFontScaling
            style={{
              color: labelColor,
              fontSize: compact ? 15 : 16,
              fontWeight: '600',
              textAlign: 'center',
            }}
            maxFontSizeMultiplier={act.maxFontSizeMultiplier}>
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
