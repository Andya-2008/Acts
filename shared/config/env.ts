import Constants from 'expo-constants';
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

type FirebaseExtra = {
  firebaseApiKey?: string;
  firebaseApiKeyIos?: string;
  firebaseApiKeyAndroid?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
};

/** Typical Firebase Web / JS client API key shape (case-sensitive). */
function looksLikeFirebaseBrowserApiKey(s: string): boolean {
  const t = str(s);
  return /^AIzaSy[\w-]{30,120}$/.test(t);
}

function str(v: string | undefined | null): string {
  if (typeof v !== 'string') return '';
  let t = v.trim();
  if (
    (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
    (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

/** Google browser keys must start with `AIzaSy`; `AlzaSy` is a frequent I/l typo in dashboards. */
function normalizeFirebaseApiKeyTypo(s: string): string {
  const t = str(s);
  if (t.startsWith('AlzaSy')) return `AIzaSy${t.slice(6)}`;
  return t;
}

/**
 * `expo.extra` can appear on `expoConfig` or legacy `manifest` depending on Updates / dev client.
 * Merge so EAS-baked Firebase values are still found at runtime.
 */
function firebaseFromManifest(): FirebaseExtra {
  const fromManifest = (Constants.manifest as { extra?: FirebaseExtra } | null)?.extra;
  const fromExpoConfig = Constants.expoConfig?.extra as FirebaseExtra | undefined;
  return { ...(fromManifest ?? {}), ...(fromExpoConfig ?? {}) };
}

/** Native Firebase apps often use a different `apiKey` than the Web app; JS SDK still uses one config object. */
export function resolveFirebaseApiKey(): string {
  const x = firebaseFromManifest();
  let key: string;
  if (Platform.OS === 'ios') {
    const iosOnly =
      str(process.env.EXPO_PUBLIC_FIREBASE_API_KEY_IOS) || str(x.firebaseApiKeyIos);
    if (looksLikeFirebaseBrowserApiKey(iosOnly)) key = iosOnly;
    else key = str(process.env.EXPO_PUBLIC_FIREBASE_API_KEY) || str(x.firebaseApiKey);
  } else if (Platform.OS === 'android') {
    const androidOnly =
      str(process.env.EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID) || str(x.firebaseApiKeyAndroid);
    if (looksLikeFirebaseBrowserApiKey(androidOnly)) key = androidOnly;
    else key = str(process.env.EXPO_PUBLIC_FIREBASE_API_KEY) || str(x.firebaseApiKey);
  } else {
    key = str(process.env.EXPO_PUBLIC_FIREBASE_API_KEY) || str(x.firebaseApiKey);
  }
  return normalizeFirebaseApiKeyTypo(key);
}

export function readFirebaseEnvCandidate(): Record<keyof FirebaseWebConfig, string> {
  const x = firebaseFromManifest();
  return {
    apiKey: resolveFirebaseApiKey(),
    authDomain: str(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN) || str(x.firebaseAuthDomain),
    projectId: str(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) || str(x.firebaseProjectId),
    storageBucket: str(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET) || str(x.firebaseStorageBucket),
    messagingSenderId:
      str(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || str(x.firebaseMessagingSenderId),
    appId: str(process.env.EXPO_PUBLIC_FIREBASE_APP_ID) || str(x.firebaseAppId),
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
