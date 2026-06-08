import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, View } from 'react-native';

import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import {
  resolveActAppearancePalette,
  type ActAppearanceColorPresetId,
  type ActAppearancePalette,
} from '@/shared/theme/appearancePalettes';
import { buildActsThemeVars } from '@/shared/theme/actsThemeVars';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { resolveActiveAppearancePreset } from '@/shared/utils/appearanceTrial';
import { useAuthStore } from '@/shared/stores/authStore';
import { getActsMaxFontSizeMultiplier } from '@/shared/utils/accessibilityText';

export type ActAppearanceContextValue = {
  palette: ActAppearancePalette;
  preset: ActAppearanceColorPresetId;
  comfortableText: boolean;
  spaciousLayout: boolean;
  maxFontSizeMultiplier: number;
  screenPaddingHorizontal: number;
  /** Bumps when app returns active so layouts re-read `PixelRatio.getFontScale()` after Larger Text changes. */
  fontScaleRevision: number;
};

const defaultValue: ActAppearanceContextValue = {
  palette: resolveActAppearancePalette('blossom'),
  preset: 'blossom',
  comfortableText: false,
  spaciousLayout: false,
  maxFontSizeMultiplier: getActsMaxFontSizeMultiplier(false),
  screenPaddingHorizontal: 20,
  fontScaleRevision: 0,
};

const ActAppearanceContext = createContext<ActAppearanceContextValue>(defaultValue);

export function ActAppearanceProvider({ children }: { children: ReactNode }) {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const [fontScaleRevision, setFontScaleRevision] = useState(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setFontScaleRevision((n) => n + 1);
      }
    });
    return () => sub.remove();
  }, []);

  const value = useMemo<ActAppearanceContextValue>(() => {
    const merged = mergeActsDefaults(userInfo?.ActsSettings);
    const preset = resolveActiveAppearancePreset(merged);
    const palette = resolveActAppearancePalette(preset);
    return {
      palette,
      preset,
      comfortableText: merged.appearanceComfortableText,
      spaciousLayout: merged.appearanceSpaciousLayout,
      maxFontSizeMultiplier: getActsMaxFontSizeMultiplier(merged.appearanceComfortableText),
      screenPaddingHorizontal: merged.appearanceSpaciousLayout ? 24 : 20,
      fontScaleRevision,
    };
  }, [userInfo?.ActsSettings, fontScaleRevision]);

  const themeVars = useMemo(() => buildActsThemeVars(value.palette), [value.palette]);

  return (
    <ActAppearanceContext.Provider value={value}>
      <View style={themeVars} className="flex-1">
        {children}
      </View>
    </ActAppearanceContext.Provider>
  );
}

export function useActAppearance(): ActAppearanceContextValue {
  return useContext(ActAppearanceContext);
}
