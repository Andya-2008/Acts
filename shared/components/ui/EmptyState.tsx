import { View } from 'react-native';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { AppText, AppButton } from '.';
import { spacing, layouts } from '@/shared/theme/designSystem';

export type EmptyStateProps = {
  /** Emoji or icon (e.g., "🔔") */
  icon: string;
  /** Heading (e.g., "No Notifications Yet") */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button */
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Empty state component for empty lists/screens
 * Shows friendly message with optional action
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const act = useActAppearance();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: layouts.screenHorizontal,
        paddingVertical: layouts.screenVertical,
        gap: spacing.md,
      }}>
      {/* Icon */}
      <AppText style={{ fontSize: 64 }}>
        {icon}
      </AppText>

      {/* Title */}
      <AppText
        variant="h3"
        style={{ color: act.palette.ink, textAlign: 'center' }}>
        {title}
      </AppText>

      {/* Description */}
      {description && (
        <AppText
          variant="bodySmall"
          style={{
            color: act.palette.muted,
            textAlign: 'center',
            maxWidth: 280,
          }}>
          {description}
        </AppText>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <View style={{ marginTop: spacing.lg, width: '100%', maxWidth: 200 }}>
          <AppButton
            title={actionLabel}
            onPress={onAction}
            variant="primary"
          />
        </View>
      )}
    </View>
  );
}
