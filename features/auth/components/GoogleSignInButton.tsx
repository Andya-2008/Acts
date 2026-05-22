import type { PressableProps } from 'react-native';
import { ActivityIndicator, PixelRatio, Pressable, Text, View } from 'react-native';

import { GoogleGLogo } from '@/features/auth/components/GoogleGLogo';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

/** https://developers.google.com/identity/branding-guidelines — light theme */
const GOOGLE_LIGHT = {
  fill: '#FFFFFF',
  stroke: '#747775',
  label: '#1F1F1F',
  fontSize: 14,
  lineHeight: 20,
} as const;

const LOGO_SIZE = 20;
const MIN_HEIGHT = 52;
const BORDER_RADIUS = 4;

export type GoogleSignInButtonIntent = 'sign-in' | 'sign-up' | 'continue';

const LABEL_BY_INTENT: Record<GoogleSignInButtonIntent, string> = {
  'sign-in': 'Sign in with Google',
  'sign-up': 'Sign up with Google',
  continue: 'Continue with Google',
};

export type GoogleSignInButtonProps = PressableProps & {
  intent?: GoogleSignInButtonIntent;
  loading?: boolean;
};

export function GoogleSignInButton({
  intent = 'sign-in',
  loading = false,
  disabled,
  className,
  style,
  ...rest
}: GoogleSignInButtonProps) {
  const label = LABEL_BY_INTENT[intent];
  const isDisabled = disabled || loading;
  const act = useActAppearance();
  const fontScale = Math.min(PixelRatio.getFontScale(), act.maxFontSizeMultiplier);
  const minHeight = Math.max(MIN_HEIGHT, Math.ceil(MIN_HEIGHT * fontScale * 0.85));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      className={`active:opacity-90 ${className ?? ''}`}
      style={(state) => {
        const user = typeof style === 'function' ? style(state) : style;
        return [
          user ?? undefined,
          {
            borderRadius: BORDER_RADIUS,
            overflow: 'hidden' as const,
            opacity: isDisabled ? 0.38 : 1,
          },
        ];
      }}
      {...rest}>
      <View
        style={{
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight,
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: GOOGLE_LIGHT.fill,
          borderWidth: 1,
          borderColor: GOOGLE_LIGHT.stroke,
          borderRadius: BORDER_RADIUS,
          width: '100%',
        }}>
        {loading ? (
          <ActivityIndicator color={GOOGLE_LIGHT.label} />
        ) : (
          <>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 12,
                width: LOGO_SIZE,
                height: LOGO_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <GoogleGLogo size={LOGO_SIZE} />
            </View>
            <Text
              allowFontScaling
              maxFontSizeMultiplier={act.maxFontSizeMultiplier}
              style={{
                flex: 1,
                color: GOOGLE_LIGHT.label,
                fontSize: GOOGLE_LIGHT.fontSize,
                lineHeight: GOOGLE_LIGHT.lineHeight,
                fontFamily: 'Roboto_500Medium',
                fontWeight: '500',
                letterSpacing: 0.1,
                textAlign: 'center',
                paddingHorizontal: LOGO_SIZE + 24,
              }}
              numberOfLines={2}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}
