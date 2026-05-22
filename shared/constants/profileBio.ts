/** Max length for `ActsSettings.bio` (public on all profiles). */
export const PROFILE_BIO_MAX_LENGTH = 50;

export function normalizeProfileBio(value: string | undefined | null): string {
  return String(value ?? '').trim().slice(0, PROFILE_BIO_MAX_LENGTH);
}
