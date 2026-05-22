import { PixelRatio, type TextProps } from 'react-native';

/**
 * Max scale for Dynamic Type / iOS Settings → Accessibility → Larger Text.
 * Previously capped at 1.2, which blocked Apple's larger accessibility sizes.
 */
export const ACTS_MAX_FONT_SIZE_MULTIPLIER_DEFAULT = 3;
export const ACTS_MAX_FONT_SIZE_MULTIPLIER_COMFORTABLE = 3.5;

export function getActsMaxFontSizeMultiplier(appearanceComfortableText: boolean): number {
  return appearanceComfortableText
    ? ACTS_MAX_FONT_SIZE_MULTIPLIER_COMFORTABLE
    : ACTS_MAX_FONT_SIZE_MULTIPLIER_DEFAULT;
}

/** Current iOS/Android font scale (1 = default). */
export function getAccessibilityFontScale(): number {
  return PixelRatio.getFontScale();
}

export function scaleForAccessibility(size: number, maxScale = ACTS_MAX_FONT_SIZE_MULTIPLIER_DEFAULT): number {
  return Math.round(size * Math.min(getAccessibilityFontScale(), maxScale));
}

/** Spread onto React Native `Text` / `TextInput` so Larger Text can apply. */
export function accessibleTextProps(maxFontSizeMultiplier: number): Pick<
  TextProps,
  'allowFontScaling' | 'maxFontSizeMultiplier'
> {
  return {
    allowFontScaling: true,
    maxFontSizeMultiplier,
  };
}
