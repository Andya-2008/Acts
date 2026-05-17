import { Platform, Text, View } from 'react-native';

import { AppText } from '@/shared/components/ui';
import { ACTS_SCRIPT_FONT_FAMILY } from '@/shared/config/fonts';

type AuthBrandingHeaderProps = {
  /** Short line under the wordmark (e.g. “Welcome back”). */
  headline?: string;
  /** Supporting copy in body style. */
  subtitle: string;
};

export function AuthBrandingHeader({ headline, subtitle }: AuthBrandingHeaderProps) {
  return (
    <View className="mb-10 items-center px-2">
      <Text
        accessibilityRole="header"
        accessibilityLabel="Acts"
        className="text-acts-green"
        style={{
          fontFamily: ACTS_SCRIPT_FONT_FAMILY,
          fontSize: Platform.select({ ios: 52, android: 50, default: 50 }),
          lineHeight: Platform.select({ ios: 60, android: 58, default: 58 }),
          letterSpacing: 0.5,
          textShadowColor: 'rgba(91, 107, 232, 0.28)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 8,
        }}>
        Acts
      </Text>
      {headline ? (
        <AppText variant="subtitle" className="mb-2 mt-5 text-center text-acts-ink">
          {headline}
        </AppText>
      ) : null}
      <AppText variant="caption" className="max-w-sm text-center leading-5 text-acts-muted">
        {subtitle}
      </AppText>
    </View>
  );
}
