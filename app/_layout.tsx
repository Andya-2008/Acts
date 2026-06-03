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
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppFirebaseMissingScreen } from '@/shared/components/AppFirebaseMissingScreen';
import { isFirebaseWebConfigConfigured } from '@/shared/config/env';
import { ActAppearanceProvider } from '@/shared/providers/ActAppearanceProvider';
import { AppQueryProvider } from '@/shared/providers/AppQueryProvider';
import { AuthStateListener } from '@/shared/providers/AuthStateListener';
import { initializeSentry, wrapRootComponent } from '@/shared/services/sentry';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://5bdcfa03ce0487d9e45b8fdb9e4a6b4d@o4511498954342400.ingest.us.sentry.io/4511498975903744',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export { ErrorBoundary } from 'expo-router';

// Initialize crash/error reporting before anything else renders (no-ops without a DSN).
initializeSentry();

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

function RootLayout() {
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
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(wrapRootComponent(RootLayout));
