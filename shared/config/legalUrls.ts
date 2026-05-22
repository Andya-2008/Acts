import Constants from 'expo-constants';

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

type LegalExtra = {
  legalBaseUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  supportUrl?: string;
};

function legalFromManifest(): LegalExtra {
  const fromManifest = (Constants.manifest as { extra?: LegalExtra } | null)?.extra;
  const fromExpoConfig = Constants.expoConfig?.extra as LegalExtra | undefined;
  return { ...(fromManifest ?? {}), ...(fromExpoConfig ?? {}) };
}

/** Custom domain when connected in Firebase Hosting. */
export const PREFERRED_LEGAL_BASE_URL = 'https://acts.app';

/** Live hosting today (Firebase). Use until acts.app DNS is connected. */
export const HOSTED_LEGAL_BASE_URL = 'https://acts-d7c7f.web.app';

export function getLegalBaseUrl(): string {
  const x = legalFromManifest();
  return (
    str(x.legalBaseUrl) ||
    str(process.env.EXPO_PUBLIC_LEGAL_BASE_URL) ||
    HOSTED_LEGAL_BASE_URL
  );
}

export function getPrivacyPolicyUrl(): string {
  const x = legalFromManifest();
  const explicit = str(x.privacyPolicyUrl) || str(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL);
  if (explicit) return explicit;
  return `${getLegalBaseUrl()}/privacy`;
}

export function getTermsOfServiceUrl(): string {
  const x = legalFromManifest();
  const explicit = str(x.termsOfServiceUrl) || str(process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL);
  if (explicit) return explicit;
  return `${getLegalBaseUrl()}/terms`;
}

export function getSupportUrl(): string {
  const x = legalFromManifest();
  const explicit = str(x.supportUrl) || str(process.env.EXPO_PUBLIC_SUPPORT_URL);
  if (explicit) return explicit;
  return `${getLegalBaseUrl()}/support`;
}

export async function openLegalUrl(url: string): Promise<void> {
  const { Linking } = await import('react-native');
  const can = await Linking.canOpenURL(url);
  if (!can) {
    throw new Error('Could not open link.');
  }
  await Linking.openURL(url);
}
