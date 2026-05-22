import { Text, useWindowDimensions, View } from 'react-native';

import { ACTS_SCRIPT_FONT_FAMILY } from '@/shared/config/fonts';
import { actsTheme } from '@/shared/theme/actsTheme';
import { AppText } from '@/shared/components/ui';

type AuthBrandingHeaderProps = {
  /** Short line under the wordmark (e.g. “Welcome back”). */
  headline?: string;
  /** Supporting copy in body style. */
  subtitle: string;
};

export function AuthBrandingHeader({ headline, subtitle }: AuthBrandingHeaderProps) {
  const { width: winW } = useWindowDimensions();
  const targetW = Math.min(300, Math.max(200, winW - 48));
  const fontSize = Math.round(Math.min(78, Math.max(48, targetW * 0.26)));
  /** Great Vibes has tall ascenders; tight lineHeight clips the top of letters (e.g. “a”). */
  const lineHeight = Math.round(fontSize * 1.45);
  const wordmarkPadTop = Math.round(fontSize * 0.12);

  return (
    <View className="mb-10 items-center px-2" style={{ paddingTop: wordmarkPadTop }}>
      <Text
        accessibilityRole="header"
        accessibilityLabel="Acts"
        allowFontScaling={false}
        style={{
          fontFamily: ACTS_SCRIPT_FONT_FAMILY,
          fontSize,
          lineHeight,
          color: actsTheme.colors.ink,
          textAlign: 'center',
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
