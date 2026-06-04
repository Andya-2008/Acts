import Constants from 'expo-constants';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Linking, Pressable, View } from 'react-native';

import {
  getPrivacyPolicyUrl,
  getSupportUrl,
  getTermsOfServiceUrl,
  openLegalUrl,
} from '@/shared/config/legalUrls';
import { AppText, Screen } from '@/shared/components/ui';

const DEVELOPER = 'Andrew Hyun';
const CONTACT_EMAIL = 'andrewhyun@live.com';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function openLink(url: string, label: string) {
  void openLegalUrl(url).catch(() => {
    Alert.alert('Could not open link', `${label} is not available right now.`);
  });
}

export default function SettingsAboutScreen() {
  const rows: { text: string; onPress?: () => void; muted?: boolean }[] = [
    { text: `Developed by ${DEVELOPER}` },
    {
      text: 'Support',
      onPress: () => openLink(getSupportUrl(), 'Support'),
      muted: true,
    },
    {
      text: 'Terms of Service',
      onPress: () => openLink(getTermsOfServiceUrl(), 'Terms of Service'),
      muted: true,
    },
    { text: `Version Number: v${APP_VERSION}` },
    {
      text: `Contact Email: ${CONTACT_EMAIL}`,
      onPress: () => {
        void Linking.openURL(`mailto:${CONTACT_EMAIL}`).catch(() => {
          Alert.alert('Email', CONTACT_EMAIL);
        });
      },
    },
    {
      text: 'Privacy Policy',
      onPress: () => openLink(getPrivacyPolicyUrl(), 'Privacy Policy'),
      muted: true,
    },
    { text: 'Built with React Native, Expo, and Firebase' },
  ];

  return (
    <Screen scroll>
      <View className="items-center pb-10 pt-2">
        <View className="mb-4 flex-row items-center justify-center gap-2">
          <Ionicons name="settings-outline" size={32} color="#2D1528" />
          <Ionicons name="heart" size={28} color="#E11D74" />
        </View>
        <AppText variant="title" className="mb-6">
          About
        </AppText>

        <View className="w-full overflow-hidden rounded-2xl border border-acts-border">
          {rows.map((r, i) => (
            <Pressable
              key={r.text}
              disabled={!r.onPress}
              onPress={r.onPress}
              className={`border-b border-acts-border px-3 py-4 ${r.muted ? 'bg-acts-canvas' : 'bg-acts-surface'} ${
                i === rows.length - 1 ? 'border-b-0' : ''
              }`}>
              <AppText variant="body" className="text-center text-acts-ink">
                {r.text}
              </AppText>
            </Pressable>
          ))}
        </View>

        <AppText variant="subtitle" className="mt-8 text-center text-acts-green">
          Thanks for helping change the world! - {DEVELOPER}
        </AppText>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="mt-10 w-full rounded-2xl bg-slate-800 py-4 active:opacity-90">
          <AppText variant="subtitle" className="text-center font-semibold text-white">
            Back
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}
