import { forwardRef } from 'react';
import type { TextInput, TextInputProps } from 'react-native';
import { View } from 'react-native';

import { ActsTextInput } from '@/shared/components/ui/ActsTextInput';
import { AppText } from '@/shared/components/ui/AppText';
import { getActsTextInputBoxStyle } from '@/shared/components/ui/actsTextInputMetrics';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

export type AppTextFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

export const AppTextField = forwardRef<TextInput, AppTextFieldProps>(function AppTextField(
  { label, errorMessage, className, style, ...rest },
  ref,
) {
  const act = useActAppearance();
  const borderColor = errorMessage ? act.palette.danger : act.palette.border;
  const isMultiline = Boolean(rest.multiline);

  return (
    <View className="mb-4">
      <AppText variant="label" className="mb-1.5">
        {label}
      </AppText>
      <ActsTextInput
        ref={ref}
        placeholderTextColor={act.palette.muted}
        className={`rounded-2xl border-2 ${className ?? ''}`}
        style={[
          {
            borderColor,
            backgroundColor: act.palette.surface,
            color: act.palette.ink,
            ...getActsTextInputBoxStyle({ multiline: isMultiline }),
          },
          style,
        ]}
        {...rest}
      />
      {errorMessage ? (
        <AppText variant="caption" className="mt-1" style={{ color: act.palette.danger }}>
          {errorMessage}
        </AppText>
      ) : null}
    </View>
  );
});
