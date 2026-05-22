import { PixelRatio, Platform, type TextStyle } from 'react-native';

import { ACTS_MAX_FONT_SIZE_MULTIPLIER_DEFAULT } from '@/shared/utils/accessibilityText';

type BoxOptions = {
  /** Default 16; use 12 for tighter rows (comments, preferences). */
  horizontalPadding?: number;
  /** When true, omit fixed `minHeight` (use with `multiline` + `min-h-*` class). */
  multiline?: boolean;
};

const INPUT_FONT_SIZE = 16;
const INPUT_LINE_HEIGHT = 22;
const INPUT_PADDING_TOP = 12;
const INPUT_PADDING_BOTTOM = Platform.OS === 'android' ? 14 : 12;

/** Minimum box height = padding + line height (+ small buffer so glyphs are not clipped). */
export const ACTS_TEXT_INPUT_MIN_HEIGHT =
  INPUT_PADDING_TOP + INPUT_PADDING_BOTTOM + INPUT_LINE_HEIGHT + 2;

/**
 * TextInput typography + padding so ascenders/descenders are not clipped on iOS/Android.
 * Prefer this over Tailwind `text-base`/`py-*` alone on inputs. Includes `minHeight`.
 */
export function getActsTextInputBoxStyle(options?: BoxOptions): TextStyle {
  const horizontalPadding = options?.horizontalPadding ?? 16;
  const multiline = options?.multiline ?? false;
  const scale = Math.min(PixelRatio.getFontScale(), ACTS_MAX_FONT_SIZE_MULTIPLIER_DEFAULT);
  const fontSize = Math.round(INPUT_FONT_SIZE * scale);
  const lineHeight = Math.round(INPUT_LINE_HEIGHT * scale);
  const scaledMinHeight = Math.ceil(INPUT_PADDING_TOP + INPUT_PADDING_BOTTOM + lineHeight + 2);
  return {
    fontSize,
    lineHeight,
    paddingHorizontal: horizontalPadding,
    paddingTop: INPUT_PADDING_TOP,
    paddingBottom: INPUT_PADDING_BOTTOM,
    ...(multiline ? {} : { minHeight: Math.max(ACTS_TEXT_INPUT_MIN_HEIGHT, scaledMinHeight) }),
  };
}
