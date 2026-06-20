import { HOSTED_LEGAL_BASE_URL } from '@/shared/config/legalUrls';

function str(v: string | undefined | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** App Store listing for Acts: Be Kind (fallback when join page is not used). */
export {
  APP_STORE_URL,
  PLAY_STORE_URL,
  getAppStoreUrl,
  getPlayStoreUrl,
  getStoreUrlForPlatform,
} from '@/shared/config/appStore';

/** Hosted invite landing (`/join`) — stores `invitedBy` and opens the app when installed. */
export function getDefaultInviteJoinBase(): string {
  const explicit = str(process.env.EXPO_PUBLIC_INVITE_URL);
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  const legalBase =
    str(process.env.EXPO_PUBLIC_LEGAL_BASE_URL) || HOSTED_LEGAL_BASE_URL;
  return `${legalBase.replace(/\/$/, '')}/join`;
}

/** Share / invite link. Defaults to Firebase `/join` (override with `EXPO_PUBLIC_INVITE_URL`). */
export function getInviteUrl(inviterUid?: string): string {
  const base = getDefaultInviteJoinBase();
  const uid = str(inviterUid);
  if (!uid) {
    return base;
  }
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}invitedBy=${encodeURIComponent(uid)}`;
}

/** Friendly share copy with the personal invite URL (`invitedBy` when signed in). */
export function getInviteShareMessage(inviterUid?: string): string {
  const url = getInviteUrl(inviterUid);
  return `Join me on Acts — small daily acts of kindness with people you know.\n\n${url}`;
}
