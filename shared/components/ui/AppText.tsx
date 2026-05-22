import type { TextProps } from 'react-native';
import { Text } from 'react-native';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import type { ActAppearancePalette } from '@/shared/theme/appearancePalettes';

type Variant = 'title' | 'subtitle' | 'body' | 'caption' | 'label';

function variantColor(variant: Variant, palette: ActAppearancePalette): string {
  switch (variant) {
    case 'title':
    case 'subtitle':
    case 'body':
      return palette.ink;
    case 'caption':
    case 'label':
      return palette.muted;
    default:
      return palette.ink;
  }
}

/** Map `text-acts-*` classes to the live palette (Tailwind vars + explicit color for reliability). */
function resolveTextColor(className: string | undefined, variant: Variant, palette: ActAppearancePalette): string {
  if (className) {
    if (/\btext-white\b/.test(className)) {
      return '#FFFFFF';
    }
    if (/\btext-acts-ink\b/.test(className)) {
      return palette.ink;
    }
    if (/\btext-acts-muted\b/.test(className)) {
      return palette.muted;
    }
    if (/\btext-acts-green\b/.test(className)) {
      return palette.green;
    }
    if (/\btext-acts-blue\b/.test(className)) {
      return palette.blue;
    }
    if (/\btext-acts-danger\b/.test(className)) {
      return palette.danger;
    }
    if (/\btext-acts-border\b/.test(className)) {
      return palette.border;
    }
  }
  return variantColor(variant, palette);
}

const variantLayout: Record<Variant, string> = {
  title: 'text-2xl font-semibold tracking-tight',
  subtitle: 'text-base font-medium',
  body: 'text-base leading-6',
  caption: 'text-sm leading-5',
  label: 'text-sm font-medium',
};

export type AppTextProps = TextProps & {
  variant?: Variant;
  /**
   * When false, do not inject palette `color` from the variant (use `className` / `style` only).
   * Use on tinted headers so `text-white` / `text-acts-ink` are not overridden by `palette.muted`.
   */
  paletteColor?: boolean;
};

export function AppText({
  variant = 'body',
  className,
  style,
  paletteColor = true,
  ...rest
}: AppTextProps) {
  const act = useActAppearance();
  const color = resolveTextColor(className, variant, act.palette);

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={act.maxFontSizeMultiplier}
      className={`${variantLayout[variant]} ${className ?? ''}`}
      style={[paletteColor ? { color } : null, style]}
      {...rest}
    />
  );
}
