import { forwardRef } from 'react';
import type { TextInputProps } from 'react-native';
import { TextInput } from 'react-native';

import { accessibleTextProps } from '@/shared/utils/accessibilityText';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

/** TextInput that respects iOS Larger Text / Dynamic Type (use with `getActsTextInputBoxStyle`). */
export const ActsTextInput = forwardRef<TextInput, TextInputProps>(function ActsTextInput(props, ref) {
  const act = useActAppearance();
  return <TextInput ref={ref} {...accessibleTextProps(act.maxFontSizeMultiplier)} {...props} />;
});
