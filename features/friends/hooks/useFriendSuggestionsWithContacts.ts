import { useEffect } from 'react';

import { useContactsOnActsMatches } from '@/features/friends/hooks/useContactsOnActsMatches';
import { useFriendSuggestions } from '@/features/friends/hooks/useFriendSuggestions';

/** Friend suggestions plus optional contact scan for the Friends screen. */
export function useFriendSuggestionsWithContacts(
  uid: string | undefined,
  blockedUidSet?: Set<string>,
) {
  const contacts = useContactsOnActsMatches(uid);

  useEffect(() => {
    if (!uid || contacts.loading || contacts.searched) {
      return;
    }
    void contacts.loadMatches();
  }, [uid, contacts.loading, contacts.searched, contacts.loadMatches]);

  const suggestions = useFriendSuggestions(uid, blockedUidSet, {
    contactMatches: contacts.matches,
    contactsReady: contacts.searched || contacts.permissionDenied,
  });

  return {
    ...suggestions,
    contactMatches: contacts.matches,
    contactsLoading: contacts.loading,
    contactsSearched: contacts.searched,
    contactsLoadError: contacts.loadError,
    refreshContacts: contacts.loadMatches,
    contactsPermissionDenied: contacts.permissionDenied,
  };
}
