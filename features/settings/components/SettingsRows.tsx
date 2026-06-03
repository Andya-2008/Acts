import { Pressable, Text, View } from 'react-native';

import { AppText } from '@/shared/components/ui/AppText';
import { InfoHintButton, TitleWithInfo } from '@/shared/components/ui/InfoHintButton';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { actsSelectionChipStyle } from '@/shared/utils/accessibilityMotion';

/** Spaced divider between settings rows. */
export function SettingsRowDivider() {
  return <View className="mb-4 mt-3 h-px bg-acts-border/45" />;
}

function SettingsRowLabel({ label, infoText }: { label: string; infoText?: string }) {
  return (
    <View className="mr-3 min-w-0 flex-1 flex-row items-center">
      <AppText variant="subtitle" className="min-w-0 flex-1 text-acts-ink" numberOfLines={3}>
        {label}
      </AppText>
      {infoText ? <InfoHintButton title={label} message={infoText} /> : null}
    </View>
  );
}

function YesNoToggle({
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
            className={`min-h-[44px] min-w-[56px] items-center justify-center rounded-xl px-3 py-2 ${
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
  );
}

export function YesNoRow({
  label,
  value,
  onPick,
  disabled,
  infoText,
  showDivider = true,
}: {
  label: string;
  value: boolean;
  onPick: (v: boolean) => void;
  disabled?: boolean;
  /** Longer explanation shown in an info alert, not on the page. */
  infoText?: string;
  showDivider?: boolean;
}) {
  return (
    <View>
      <View className="flex-row items-center justify-between py-3">
        <SettingsRowLabel label={label} infoText={infoText} />
        <YesNoToggle label={label} value={value} onPick={onPick} disabled={disabled} />
      </View>
      {showDivider ? <SettingsRowDivider /> : null}
    </View>
  );
}

export function FriendsOrMeRow({
  label,
  value,
  onPick,
  disabled,
  infoText,
  showDivider = true,
}: {
  label: string;
  value: 'friends_only' | 'only_me';
  onPick: (v: 'friends_only' | 'only_me') => void;
  disabled?: boolean;
  infoText?: string;
  showDivider?: boolean;
}) {
  const act = useActAppearance();
  const opts: { key: 'friends_only' | 'only_me'; label: string }[] = [
    { key: 'friends_only', label: 'Friends Only' },
    { key: 'only_me', label: 'Only Me' },
  ];
  return (
    <View>
      <View className="flex-row items-center justify-between py-3">
        <SettingsRowLabel label={label} infoText={infoText} />
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
                className={`min-h-[44px] items-center justify-center rounded-xl px-2.5 py-2 ${
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
      {showDivider ? <SettingsRowDivider /> : null}
    </View>
  );
}

export function ThreeChoiceRow({
  label,
  value,
  options,
  onPick,
  disabled,
  infoText,
  showDivider = true,
}: {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onPick: (key: string) => void;
  disabled?: boolean;
  infoText?: string;
  showDivider?: boolean;
}) {
  const act = useActAppearance();
  return (
    <View>
      <View className="py-3">
        <View className="mb-2.5">
          <TitleWithInfo title={label} infoText={infoText} variant="subtitle" />
        </View>
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
                className={`min-h-[44px] items-center justify-center rounded-xl px-3 py-2 ${
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
      {showDivider ? <SettingsRowDivider /> : null}
    </View>
  );
}
