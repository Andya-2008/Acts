import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import {
  resolveActAppearancePalette,
  type ActAppearanceColorPresetId,
  type ActAppearancePalette,
} from '@/shared/theme/appearancePalettes';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { useAuthStore } from '@/shared/stores/authStore';

export type ActAppearanceContextValue = {
  palette: ActAppearancePalette;
  preset: ActAppearanceColorPresetId;
  comfortableText: boolean;
  spaciousLayout: boolean;
  maxFontSizeMultiplier: number;
  screenPaddingHorizontal: number;
};

const defaultValue: ActAppearanceContextValue = {
  palette: resolveActAppearancePalette('blossom'),
  preset: 'blossom',
  comfortableText: false,
  spaciousLayout: false,
  maxFontSizeMultiplier: 1.2,
  screenPaddingHorizontal: 20,
};

const ActAppearanceContext = createContext<ActAppearanceContextValue>(defaultValue);

export function ActAppearanceProvider({ children }: { children: ReactNode }) {
  const uid = useAuthStore((s) => s.user?.uid);
  const { data: userInfo } = useUserInfoQuery(uid);

  const value = useMemo<ActAppearanceContextValue>(() => {
    const merged = mergeActsDefaults(userInfo?.ActsSettings);
    const preset = merged.appearanceColorPreset;
    const palette = resolveActAppearancePalette(preset);
    return {
      palette,
      preset,
      comfortableText: merged.appearanceComfortableText,
      spaciousLayout: merged.appearanceSpaciousLayout,
      maxFontSizeMultiplier: merged.appearanceComfortableText ? 1.45 : 1.2,
      screenPaddingHorizontal: merged.appearanceSpaciousLayout ? 24 : 20,
    };
  }, [userInfo?.ActsSettings]);

  return <ActAppearanceContext.Provider value={value}>{children}</ActAppearanceContext.Provider>;
}

export function useActAppearance(): ActAppearanceContextValue {
  return useContext(ActAppearanceContext);
}
