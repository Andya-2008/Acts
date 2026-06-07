import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

const PENDING_INVITER_KEY = '@acts/pending_invited_by_uid_v1';

/** Query keys used on invite / landing URLs. */
const INVITER_PARAM_KEYS = ['invitedBy', 'ref', 'inviter'] as const;

export function parseInviterUidFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    if (trimmed.startsWith('acts://')) {
      const parsed = Linking.parse(trimmed);
      for (const key of INVITER_PARAM_KEYS) {
        const v = parsed.queryParams?.[key];
        const uid = typeof v === 'string' ? v : Array.isArray(v) ? v[0] : null;
        if (uid && isValidInviterUid(uid)) {
          return uid;
        }
      }
    }

    const asUrl = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(asUrl);
    for (const key of INVITER_PARAM_KEYS) {
      const uid = parsed.searchParams.get(key);
      if (uid && isValidInviterUid(uid)) {
        return uid;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function isValidInviterUid(uid: string): boolean {
  const t = uid.trim();
  return t.length >= 10 && t.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(t);
}

export async function stashPendingInviterUid(inviterUid: string): Promise<void> {
  const id = inviterUid.trim();
  if (!isValidInviterUid(id)) {
    return;
  }
  await AsyncStorage.setItem(PENDING_INVITER_KEY, id);
}

/** Returns and clears a pending inviter captured before sign-up. */
export async function consumePendingInviterUid(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_INVITER_KEY);
    await AsyncStorage.removeItem(PENDING_INVITER_KEY);
    if (!raw || !isValidInviterUid(raw)) {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export async function peekPendingInviterUid(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_INVITER_KEY);
    if (!raw || !isValidInviterUid(raw)) {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export async function captureInviteAttributionFromUrl(url: string | null | undefined): Promise<void> {
  if (!url) {
    return;
  }
  const inviter = parseInviterUidFromUrl(url);
  if (inviter) {
    await stashPendingInviterUid(inviter);
  }
}
