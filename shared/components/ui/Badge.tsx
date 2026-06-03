import { View } from 'react-native';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { AppText } from './AppText';
import { borderRadius, spacing } from '@/shared/theme/designSystem';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md';

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string; // emoji
};

/**
 * Badge component for status labels, tags, and indicators
 * Used in lists, cards, and headers
 */
export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  icon,
}: BadgeProps) {
  const act = useActAppearance();

  // Color scheme by variant
  let backgroundColor = act.palette.blue;
  let textColor = '#FFFFFF';

  switch (variant) {
    case 'success':
      backgroundColor = act.palette.green;
      textColor = '#FFFFFF';
      break;
    case 'warning':
      backgroundColor = '#FCD34D'; // Amber
      textColor = act.palette.ink;
      break;
    case 'danger':
      backgroundColor = act.palette.danger;
      textColor = '#FFFFFF';
      break;
    case 'info':
      backgroundColor = act.palette.blueSoft;
      textColor = act.palette.blue;
      break;
    default:
      backgroundColor = `${act.palette.green}15`;
      textColor = act.palette.green;
  }

  const isSmall = size === 'sm';
  const padding = isSmall ? spacing.xs : spacing.sm;

  return (
    <View
      style={{
        paddingHorizontal: padding,
        paddingVertical: isSmall ? spacing.xs / 2 : spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor,
        flexDirection: 'row',
        alignItems: 'center',
        gap: isSmall ? 4 : spacing.xs,
      }}>
      {icon && (
        <AppText
          style={{ fontSize: isSmall ? 12 : 14 }}>
          {icon}
        </AppText>
      )}
      <AppText
        variant={isSmall ? 'captionSmall' : 'caption'}
        style={{ color: textColor, fontWeight: '600' }}>
        {label}
      </AppText>
    </View>
  );
}
