import { Pressable, Text, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { actsSelectionChipStyle } from '@/shared/utils/accessibilityMotion';

export function YesNoRow({
  label,
  value,
  onPick,
  disabled,
}: {
  label: string;
  value: boolean;
  onPick: (v: boolean) => void;
  disabled?: boolean;
}) {
  const act = useActAppearance();
  return (
    <View className="flex-row items-center justify-between border-b border-acts-border py-3.5">
      <AppText variant="subtitle" className="mr-3 min-w-0 flex-1 text-acts-ink">
        {label}
      </AppText>
      <View className="flex-row gap-2">
        {(['Yes', 'No'] as const).map((side, i) => {
          const v = i === 0;
          const sel = value === v;
          return (
            <Pressable
              key={side}
              accessibilityRole="button"
              accessibilityState={{ selected: sel, disabled: !!disabled }}
              accessibilityLabel={`${label}, ${side}`}
              disabled={disabled}
              onPress={() => onPick(v)}
              className={`min-h-[44px] min-w-[56px] items-center justify-center rounded-xl border px-3 py-2 ${
                disabled ? 'opacity-50' : ''
              }`}
              style={actsSelectionChipStyle(act.palette, sel)}>
              <Text
                allowFontScaling
                style={{
                  fontSize: 14,
                  fontWeight: sel ? '700' : '500',
                  color: sel ? '#FFFFFF' : act.palette.muted,
                }}
                maxFontSizeMultiplier={act.maxFontSizeMultiplier}>
                {side}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function FriendsOrMeRow({
  label,
  value,
  onPick,
  disabled,
}: {
  label: string;
  value: 'friends_only' | 'only_me';
  onPick: (v: 'friends_only' | 'only_me') => void;
  disabled?: boolean;
}) {
  const act = useActAppearance();
  const opts: { key: 'friends_only' | 'only_me'; label: string }[] = [
    { key: 'friends_only', label: 'Friends Only' },
    { key: 'only_me', label: 'Only Me' },
  ];
  return (
    <View className="flex-row items-center justify-between border-b border-acts-border py-3.5">
      <AppText variant="subtitle" className="mr-2 min-w-0 flex-1 text-acts-ink">
        {label}
      </AppText>
      <View className="flex-row flex-wrap justify-end gap-2">
        {opts.map((o) => {
          const sel = value === o.key;
          return (
            <Pressable
              key={o.key}
              accessibilityRole="button"
              accessibilityState={{ selected: sel, disabled: !!disabled }}
              accessibilityLabel={`${label}, ${o.label}`}
              disabled={disabled}
              onPress={() => onPick(o.key)}
              className={`min-h-[44px] items-center justify-center rounded-xl border px-2.5 py-2 ${
                disabled ? 'opacity-50' : ''
              }`}
              style={actsSelectionChipStyle(act.palette, sel)}>
              <Text
                allowFontScaling
                style={{
                  fontSize: 13,
                  fontWeight: sel ? '700' : '500',
                  color: sel ? '#FFFFFF' : act.palette.muted,
                }}
                maxFontSizeMultiplier={act.maxFontSizeMultiplier}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ThreeChoiceRow({
  label,
  value,
  options,
  onPick,
  disabled,
}: {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onPick: (key: string) => void;
  disabled?: boolean;
}) {
  const act = useActAppearance();
  return (
    <View className="border-b border-acts-border py-3.5">
      <AppText variant="subtitle" className="mb-2.5 text-acts-ink">
        {label}
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const sel = value === o.key;
          return (
            <Pressable
              key={o.key}
              accessibilityRole="button"
              accessibilityState={{ selected: sel, disabled: !!disabled }}
              accessibilityLabel={`${label}, ${o.label}`}
              disabled={disabled}
              onPress={() => onPick(o.key)}
              className={`min-h-[44px] items-center justify-center rounded-xl border px-3 py-2 ${
                disabled ? 'opacity-50' : ''
              }`}
              style={actsSelectionChipStyle(act.palette, sel)}>
              <Text
                allowFontScaling
                style={{
                  fontSize: 14,
                  fontWeight: sel ? '700' : '500',
                  color: sel ? '#FFFFFF' : act.palette.muted,
                }}
                maxFontSizeMultiplier={act.maxFontSizeMultiplier}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
