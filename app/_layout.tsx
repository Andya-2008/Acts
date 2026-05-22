import '../global.css';
import 'react-native-reanimated';

import { GreatVibes_400Regular, useFonts } from '@expo-google-fonts/great-vibes';
import { Roboto_500Medium } from '@expo-google-fonts/roboto';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';

import { AppFirebaseMissingScreen } from '@/shared/components/AppFirebaseMissingScreen';
import { isFirebaseWebConfigConfigured } from '@/shared/config/env';
import { ActAppearanceProvider } from '@/shared/providers/ActAppearanceProvider';
import { AppQueryProvider } from '@/shared/providers/AppQueryProvider';
import { AuthStateListener } from '@/shared/providers/AuthStateListener';

export { ErrorBoundary } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    GreatVibes_400Regular,
    Roboto_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!isFirebaseWebConfigConfigured()) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppFirebaseMissingScreen />
      </ThemeProvider>
    );
  }

  return (
    <AppQueryProvider>
      <AuthStateListener>
        <ActAppearanceProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="onboarding" />
            </Stack>
          </ThemeProvider>
        </ActAppearanceProvider>
      </AuthStateListener>
    </AppQueryProvider>
  );
}
