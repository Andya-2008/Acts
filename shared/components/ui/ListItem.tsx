import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { components, spacing, borderRadius, shadows } from '@/shared/theme/designSystem';
import { AppText } from './AppText';

type ListItemVariant = 'default' | 'subtle' | 'bordered';

export type ListItemProps = {
  /** Primary text */
  title: string;
  /** Secondary text below title */
  subtitle?: string;
  /** Icon or avatar on left */
  leftElement?: ReactNode;
  /** Badge, status indicator on right */
  rightElement?: ReactNode;
  /** Trailing action button or icon */
  onPress?: () => void;
  variant?: ListItemVariant;
  disabled?: boolean;
  className?: string;
};

/**
 * Clean, modern list item component
 * Replaces verbose FlatList item renders with consistent styling
 */
export function ListItem({
  title,
  subtitle,
  leftElement,
  rightElement,
  onPress,
  variant = 'default',
  disabled = false,
  className,
}: ListItemProps) {
  const act = useActAppearance();

  let containerStyle: any = {};
  let backgroundColor = 'transparent';

  if (variant === 'default') {
    containerStyle = {
      backgroundColor: act.palette.surface,
      borderRadius: borderRadius.lg,
      ...shadows.xs,
    };
  } else if (variant === 'bordered') {
    containerStyle = {
      backgroundColor: act.palette.surface,
      borderColor: `${act.palette.border}66`,
      borderWidth: 1,
      borderRadius: borderRadius.lg,
    };
  } else if (variant === 'subtle') {
    backgroundColor = `${act.palette.green}05`; // Very light tint
  }

  const inner = (
    <View
      style={{
        ...components.listItem,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...containerStyle,
      }}>
      {/* Left element (avatar, icon) */}
      {leftElement && (
        <View style={{ marginRight: spacing.md }}>{leftElement}</View>
      )}

      {/* Center content (title + subtitle) */}
      <View style={{ flex: 1, gap: spacing.xs }}>
        <AppText
          variant="bodyMedium"
          style={{ color: act.palette.ink }}>
          {title}
        </AppText>
        {subtitle && (
          <AppText
            variant="caption"
            style={{ color: act.palette.muted }}>
            {subtitle}
          </AppText>
        )}
      </View>

      {/* Right element (badge, icon) */}
      {rightElement && (
        <View style={{ marginLeft: spacing.md }}>{rightElement}</View>
      )}
    </View>
  );

  if (!onPress) {
    return <View className={className}>{inner}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      className={className}>
      {inner}
    </Pressable>
  );
}
