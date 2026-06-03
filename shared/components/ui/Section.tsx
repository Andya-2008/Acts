import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { AppText } from './AppText';
import { layouts, spacing } from '@/shared/theme/designSystem';

export type SectionProps = {
  /** Section title (e.g., "Your Leaderboard") */
  title?: string;
  /** Subtitle or description */
  subtitle?: string;
  children: ReactNode;
  /** Spacing between title and content */
  titleGap?: number;
  /** Whether to add bottom margin */
  withMargin?: boolean;
};

/**
 * Section component for organizing screen content
 * Provides consistent spacing and header styling
 */
export function Section({
  title,
  subtitle,
  children,
  titleGap = spacing.md,
  withMargin = true,
}: SectionProps) {
  const act = useActAppearance();

  return (
    <View
      style={{
        marginBottom: withMargin ? layouts.sectionGap : 0,
        gap: title ? titleGap : 0,
      }}>
      {title && (
        <View style={{ gap: spacing.xs }}>
          <AppText
            variant="h3"
            style={{ color: act.palette.ink }}>
            {title}
          </AppText>
          {subtitle && (
            <AppText
              variant="bodySmall"
              style={{ color: act.palette.muted }}>
              {subtitle}
            </AppText>
          )}
        </View>
      )}
      {children}
    </View>
  );
}
