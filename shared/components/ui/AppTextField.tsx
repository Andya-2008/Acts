import { forwardRef } from 'react';
import type { TextInputProps } from 'react-native';
import { TextInput, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
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

  return (
    <View className="mb-4">
      <AppText variant="label" className="mb-1.5">
        {label}
      </AppText>
      <TextInput
        ref={ref}
        placeholderTextColor={act.palette.muted}
        className={`rounded-2xl border-2 px-4 py-3.5 text-base ${className ?? ''}`}
        style={[
          {
            borderColor,
            backgroundColor: act.palette.surface,
            color: act.palette.ink,
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
