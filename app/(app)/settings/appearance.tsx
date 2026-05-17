import { Pressable, Text, View } from 'react-native';

import { YesNoRow } from '@/features/settings/components/SettingsRows';
import { useMergeActsSettingsMutation } from '@/features/user-profile/hooks/useUserInfoMutations';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { AppText, Screen } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';
import {
  ACT_APPEARANCE_PRESET_LABELS,
  resolveActAppearancePalette,
  type ActAppearanceColorPresetId,
} from '@/shared/theme/appearancePalettes';
import { mergeActsDefaults } from '@/shared/types/actsSettings';

const PRESET_ORDER: ActAppearanceColorPresetId[] = ['blossom', 'evergreen', 'ocean', 'dawn'];

export default function SettingsAppearanceScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const mutation = useMergeActsSettingsMutation(uid);
  const base = mergeActsDefaults(userInfo?.ActsSettings);
  const act = useActAppearance();

  return (
    <Screen scroll>
      <View className="pb-8">
        <AppText variant="title" className="mb-1 text-acts-ink">
          Appearance
        </AppText>
        <AppText variant="caption" className="mb-6 text-acts-muted">
          Syncs to your profile.
        </AppText>

        <AppText variant="label" className="mb-2 text-acts-muted">
          Color theme
        </AppText>
        <View className="mb-8 flex-row flex-wrap gap-2">
          {PRESET_ORDER.map((id) => {
            const selected = base.appearanceColorPreset === id;
            const pal = resolveActAppearancePalette(id);
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Theme ${ACT_APPEARANCE_PRESET_LABELS[id]}`}
                disabled={mutation.isPending}
                onPress={() => void mutation.mutateAsync({ appearanceColorPreset: id })}
                className="min-h-[52px] min-w-[47%] flex-1 flex-row items-center gap-3 rounded-2xl border-2 px-3 py-3"
                style={{
                  borderColor: selected ? act.palette.green : act.palette.border,
                  backgroundColor: selected ? act.palette.green : act.palette.surface,
                }}>
                <View className="flex-row gap-1">
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: pal.green }} />
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: pal.blue }} />
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: pal.canvas }} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: '600',
                    color: selected ? '#FFFFFF' : act.palette.ink,
                  }}
                  maxFontSizeMultiplier={act.maxFontSizeMultiplier}>
                  {ACT_APPEARANCE_PRESET_LABELS[id]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <YesNoRow
          label="Comfortable text size"
          value={base.appearanceComfortableText}
          onPick={(v) => void mutation.mutateAsync({ appearanceComfortableText: v })}
          disabled={mutation.isPending}
        />
        <YesNoRow
          label="Roomier screen margins"
          value={base.appearanceSpaciousLayout}
          onPick={(v) => void mutation.mutateAsync({ appearanceSpaciousLayout: v })}
          disabled={mutation.isPending}
        />
      </View>
    </Screen>
  );
}
