import { normalizePhoneKey } from '@/features/friends/services/registeredContactKeysRepository';

/** True when the profile has a usable phone for contact matching. */
export function profileHasSavedPhone(phone: string | null | undefined): boolean {
  return normalizePhoneKey(String(phone ?? '')) !== null;
}
