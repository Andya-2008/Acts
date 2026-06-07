import {
  emailKeyDocId,
  fetchRegisteredUserByKeyDocId,
  normalizeEmailKey,
  normalizePhoneKey,
  phoneKeyDocId,
} from '@/features/friends/services/registeredContactKeysRepository';

/** Client-side validation before sending a friend request lookup. */
export function validateFriendLookupInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'Enter a username, email, or phone number.';
  }
  if (trimmed.includes('@')) {
    if (!normalizeEmailKey(trimmed)) {
      return 'Enter a valid email address.';
    }
    return null;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 10) {
    if (!normalizePhoneKey(trimmed)) {
      return 'Enter a valid phone number (at least 10 digits).';
    }
    return null;
  }
  const username = trimmed.replace(/^@+/, '');
  if (username.length < 3) {
    return 'Usernames need at least 3 characters.';
  }
  return null;
}

function looksLikeEmailAttempt(raw: string): boolean {
  return raw.trim().includes('@');
}
