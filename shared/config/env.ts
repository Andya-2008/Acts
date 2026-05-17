import { Platform } from 'react-native';
import { z } from 'zod';

const firebaseEnvSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  storageBucket: z.string().min(1),
  messagingSenderId: z.string().min(1),
  appId: z.string().min(1),
});

export type FirebaseWebConfig = z.infer<typeof firebaseEnvSchema>;

const ENV_LABELS: Record<keyof FirebaseWebConfig, string> = {
  apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY (use EXPO_PUBLIC_FIREBASE_API_KEY_IOS / _ANDROID on native)',
  authDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
};

/** Native Firebase apps often use a different `apiKey` than the Web app; JS SDK still uses one config object. */
export function resolveFirebaseApiKey(): string {
  if (Platform.OS === 'ios') {
    return (
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY_IOS?.trim() ||
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() ||
      ''
    );
  }
  if (Platform.OS === 'android') {
    return (
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID?.trim() ||
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() ||
      ''
    );
  }
  return process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() ?? '';
}

export function readFirebaseEnvCandidate(): Record<keyof FirebaseWebConfig, string> {
  return {
    apiKey: resolveFirebaseApiKey(),
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() ?? '',
  };
}

export function isFirebaseWebConfigConfigured(): boolean {
  return firebaseEnvSchema.safeParse(readFirebaseEnvCandidate()).success;
}

export function listMissingFirebaseEnvVars(): string[] {
  const c = readFirebaseEnvCandidate();
  return (Object.keys(c) as (keyof FirebaseWebConfig)[])
    .filter((k) => !c[k])
    .map((k) => ENV_LABELS[k]);
}

export function getFirebaseWebConfig(): FirebaseWebConfig {
  const candidate = readFirebaseEnvCandidate();
  const parsed = firebaseEnvSchema.safeParse(candidate);
  if (!parsed.success) {
    const missing = listMissingFirebaseEnvVars();
    const hint =
      missing.length > 0
        ? ` Missing or empty: ${missing.join(', ')}.`
        : ` ${parsed.error.message}`;
    throw new Error(
      `Firebase is not configured. Add variables to the project root .env file (see .env.example), then restart Expo (stop Metro and run npx expo start again).${hint}`,
    );
  }

  return parsed.data;
}
