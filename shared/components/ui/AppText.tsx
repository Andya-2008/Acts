import type { TextProps } from 'react-native';
import { Text } from 'react-native';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import type { ActAppearancePalette } from '@/shared/theme/appearancePalettes';
import { typography } from '@/shared/theme/designSystem';

type Variant =
  | 'title'
  | 'subtitle'
  | 'body'
  | 'caption'
  | 'label'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyMedium'
  | 'bodySmall'
  | 'captionSmall';

function variantColor(variant: Variant, palette: ActAppearancePalette): string {
  switch (variant) {
    case 'title':
    case 'h1':
    case 'h2':
    case 'h3':
    case 'subtitle':
    case 'body':
    case 'bodyMedium':
    case 'bodySmall':
      return palette.ink;
    case 'caption':
    case 'captionSmall':
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
  h1: 'text-3xl font-bold tracking-tight',
  h2: 'text-2xl font-bold tracking-tight',
  h3: 'text-xl font-semibold',
  subtitle: 'text-base font-medium',
  body: 'text-base leading-6',
  bodyMedium: 'text-base font-medium leading-6',
  bodySmall: 'text-sm leading-5',
  caption: 'text-sm leading-5',
  captionSmall: 'text-xs font-medium',
  label: 'text-sm font-medium',
};

const variantTypography: Partial<Record<Variant, (typeof typography)[keyof typeof typography]>> = {
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  bodyMedium: typography.bodyMedium,
  bodySmall: typography.bodySmall,
  captionSmall: typography.captionSmall,
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
  const typographyStyle = variantTypography[variant];

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={act.maxFontSizeMultiplier}
      className={`${variantLayout[variant]} ${className ?? ''}`}
      style={[typographyStyle, paletteColor ? { color } : null, style]}
      {...rest}
    />
  );
}
