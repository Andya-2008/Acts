import { getLegalBaseUrl } from '@/shared/config/legalUrls';

function str(v: string | undefined | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Share / invite link (defaults to working legal host until acts.app DNS is live). */
export function getInviteUrl(): string {
  const explicit = str(process.env.EXPO_PUBLIC_INVITE_URL);
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  return getLegalBaseUrl();
}

export function getInviteShareMessage(): string {
  return `Join me on Acts — kindness as a habit. ${getInviteUrl()}`;
}
