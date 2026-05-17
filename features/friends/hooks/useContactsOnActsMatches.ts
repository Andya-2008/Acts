import * as Contacts from 'expo-contacts';
import { useCallback, useMemo, useState } from 'react';

import { fetchFriendUids } from '@/features/friends/services/friendsRepository';
import {
  emailKeyDocId,
  fetchRegisteredUserByKeyDocId,
  normalizeEmailKey,
  normalizePhoneKey,
  phoneKeyDocId,
} from '@/features/friends/services/registeredContactKeysRepository';
import { fetchProfilePicUrlsForUids } from '@/features/user-profile/services/userInfoRepository';

export type ContactOnActsMatch = {
  /** Device contact display name */
  contactLabel: string;
  matchedVia: 'email' | 'phone';
  /** Acts account */
  uid: string;
  username: string;
  first: string;
  last: string;
  profilePicUrl?: string | null;
};

const BATCH = 24;
const CONTACT_PAGE_SIZE = 500;
/** Safety cap on distinct email/phone keys per scan (very large address books). */
const MAX_DISTINCT_LOOKUPS = 4000;

async function fetchAllContactsForMatching(): Promise<Contacts.ExistingContact[]> {
  const fields = [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers, Contacts.Fields.Name] as const;
  const out: Contacts.ExistingContact[] = [];
  let pageOffset = 0;
  for (let page = 0; page < 40; page += 1) {
    const response = await Contacts.getContactsAsync({
      pageSize: CONTACT_PAGE_SIZE,
      pageOffset,
      fields: [...fields],
    });
    out.push(...response.data);
    if (response.data.length === 0) {
      break;
    }
    const partialPage = response.data.length < CONTACT_PAGE_SIZE;
    if (partialPage || !response.hasNextPage) {
      break;
    }
    pageOffset += response.data.length;
  }
  return out;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const slice = items.slice(i, i + limit);
    const part = await Promise.all(slice.map(fn));
    out.push(...part);
  }
  return out;
}

export function useContactsOnActsMatches(currentUid: string | undefined) {
  const [matches, setMatches] = useState<ContactOnActsMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentUid) {
      return;
    }
    setLoading(true);
    setPermissionDenied(false);
    setLoadError(null);
    try {
      if (!Contacts.getContactsAsync) {
        setMatches([]);
        return;
      }
      const perm = await Contacts.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        setPermissionDenied(true);
        setMatches([]);
        return;
      }
      const data = await fetchAllContactsForMatching();

      type Lookup = { docId: string; via: 'email' | 'phone'; contactLabel: string };
      const lookups: Lookup[] = [];

      for (const c of data) {
        const contactLabel =
          c.name?.trim() || [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || 'Contact';
        const emails = c.emails ?? [];
        const phones = c.phoneNumbers ?? [];
        for (const e of emails) {
          const raw = e.email?.trim();
          if (!raw) {
            continue;
          }
          const norm = normalizeEmailKey(raw);
          if (norm) {
            lookups.push({ docId: emailKeyDocId(norm), via: 'email', contactLabel });
          }
        }
        for (const p of phones) {
          const candidates = [p.number, p.digits != null ? String(p.digits) : ''].filter(
            (x): x is string => typeof x === 'string' && x.trim().length > 0,
          );
          for (const raw of candidates) {
            const norm = normalizePhoneKey(raw);
            if (norm) {
              lookups.push({ docId: phoneKeyDocId(norm), via: 'phone', contactLabel });
            }
          }
        }
      }

      const dedupeDocIds = new Map<string, Lookup>();
      for (const l of lookups) {
        if (!dedupeDocIds.has(l.docId)) {
          dedupeDocIds.set(l.docId, l);
        }
      }
      const unique = [...dedupeDocIds.values()].slice(0, MAX_DISTINCT_LOOKUPS);

      const hits = await mapWithConcurrency(unique, BATCH, async (l) => {
        const reg = await fetchRegisteredUserByKeyDocId(l.docId);
        if (!reg || reg.uid === currentUid) {
          return null;
        }
        return {
          contactLabel: l.contactLabel,
          matchedVia: l.via,
          uid: reg.uid,
          username: reg.username,
          first: reg.first,
          last: reg.last,
        } satisfies ContactOnActsMatch;
      });

      const byUid = new Map<string, ContactOnActsMatch>();
      for (const h of hits) {
        if (h && !byUid.has(h.uid)) {
          byUid.set(h.uid, h);
        }
      }
      const sorted = [...byUid.values()].sort((a, b) => a.username.localeCompare(b.username));
      const friendIds = new Set(await fetchFriendUids(currentUid));
      const candidates = sorted.filter((m) => !friendIds.has(m.uid));
      const pics = await fetchProfilePicUrlsForUids(candidates.map((m) => m.uid));
      setMatches(
        candidates.map((m) => ({
          ...m,
          profilePicUrl: pics[m.uid] ?? null,
        })),
      );
    } catch (e) {
      setMatches([]);
      setLoadError(e instanceof Error ? e.message : 'Could not scan contacts. Try again.');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [currentUid]);

  const clear = useCallback(() => {
    setMatches([]);
    setPermissionDenied(false);
    setSearched(false);
    setLoadError(null);
  }, []);

  return useMemo(
    () => ({
      matches,
      loading,
      permissionDenied,
      searched,
      loadError,
      loadMatches: load,
      clearMatches: clear,
    }),
    [matches, loading, permissionDenied, searched, loadError, load, clear],
  );
}
