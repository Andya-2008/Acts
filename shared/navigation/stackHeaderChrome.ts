import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import type { ActAppearanceContextValue } from '@/shared/providers/ActAppearanceProvider';

/** Shared native stack header styling + safe horizontal padding for custom header buttons. */
export function stackHeaderChrome(act: ActAppearanceContextValue): NativeStackNavigationOptions {
  return {
    headerShadowVisible: false,
    headerStyle: { backgroundColor: act.palette.canvas },
    headerTintColor: act.palette.ink,
    headerTitleStyle: { color: act.palette.ink, fontWeight: '700' as const },
    headerBackTitle: '',
  };
}
