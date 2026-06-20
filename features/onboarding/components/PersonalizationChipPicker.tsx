import { Pressable, View } from 'react-native';

import type { PersonalizationChoice } from '@/features/onboarding/config/personalizationChoices';
import { AppText } from '@/shared/components/ui';

type PersonalizationChipPickerProps = {
  choices: PersonalizationChoice[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  errorMessage?: string;
};

export function PersonalizationChipPicker({
  choices,
  value,
  onChange,
  max,
  errorMessage,
}: PersonalizationChipPickerProps) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
      return;
    }
    if (max != null && value.length >= max) {
      return;
    }
    onChange([...value, id]);
  };

  return (
    <View className="mb-2">
      <View className="flex-row flex-wrap gap-2">
        {choices.map((c) => {
          const selected = value.includes(c.id);
          const atCap = max != null && !selected && value.length >= max;
          return (
            <Pressable
              key={c.id}
              onPress={() => toggle(c.id)}
              disabled={atCap}
              className={`rounded-2xl border px-4 py-2.5 ${
                selected
                  ? 'border-acts-green bg-acts-green-soft'
                  : atCap
                    ? 'border-acts-border bg-acts-surface opacity-50'
                    : 'border-acts-border bg-acts-surface'
              }`}>
              <AppText variant="caption" className="text-acts-ink">
                {c.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {errorMessage ? (
        <AppText variant="caption" className="mt-1 text-acts-danger">
          {errorMessage}
        </AppText>
      ) : null}
    </View>
  );
}
