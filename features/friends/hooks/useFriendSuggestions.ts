import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { ContactOnActsMatch } from '@/features/friends/hooks/useContactsOnActsMatches';
import { friendsQueryKeys } from '@/features/friends/queryKeys';
import { fetchFriendSuggestions } from '@/features/friends/services/friendSuggestionsService';

type UseFriendSuggestionsOptions = {
  contactMatches?: ContactOnActsMatch[];
  contactsReady?: boolean;
};

export function useFriendSuggestions(
  uid: string | undefined,
  blockedUidSet?: Set<string>,
  options: UseFriendSuggestionsOptions = {},
) {
  const queryClient = useQueryClient();
  const contactMatches = options.contactMatches ?? [];
  const contactsReady = options.contactsReady ?? true;

  const contactKey = useMemo(
    () => contactMatches.map((m) => m.uid).sort().join(','),
    [contactMatches],
  );

  const query = useQuery({
    queryKey: friendsQueryKeys.suggestions(uid ?? '', contactKey),
    queryFn: () => fetchFriendSuggestions(uid!, contactMatches),
    enabled: Boolean(uid) && contactsReady,
    staleTime: 30_000,
    retry: 1,
  });

  const suggestions = useMemo(
    () => (query.data ?? []).filter((s) => !blockedUidSet?.has(s.uid)),
    [query.data, blockedUidSet],
  );

  const refreshNewSuggestions = useCallback(async () => {
    if (!uid) {
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: friendsQueryKeys.suggestions(uid, contactKey),
    });
    await queryClient.fetchQuery({
      queryKey: friendsQueryKeys.suggestions(uid, contactKey),
      queryFn: () => fetchFriendSuggestions(uid, contactMatches),
    });
  }, [queryClient, uid, contactKey, contactMatches]);

  return {
    suggestions,
    isLoading: !contactsReady || query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refreshNewSuggestions,
    refetchSuggestions: query.refetch,
  };
}
