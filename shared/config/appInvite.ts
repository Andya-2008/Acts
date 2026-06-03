function str(v: string | undefined | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** App Store listing for Acts: Be Kind (used as the default invite/download link). */
const APP_STORE_URL = 'https://apps.apple.com/us/app/acts-be-kind/id6770841231';

/** Share / invite link. Override with `EXPO_PUBLIC_INVITE_URL` (e.g. a universal link once Android is live). */
export function getInviteUrl(): string {
  const explicit = str(process.env.EXPO_PUBLIC_INVITE_URL);
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  return APP_STORE_URL;
}

export function getInviteShareMessage(): string {
  return getInviteUrl();
}
