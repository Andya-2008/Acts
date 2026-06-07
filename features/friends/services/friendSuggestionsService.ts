import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';

import type { ContactOnActsMatch } from '@/features/friends/hooks/useContactsOnActsMatches';
import { fetchFriendSuggestionsLocal } from '@/features/friends/services/fetchFriendSuggestionsLocal';
import {
  clearRecentFriendSuggestionUids,
  getRecentFriendSuggestionUids,
  markFriendSuggestionsShown,
} from '@/features/friends/friendSuggestionsStorage';
import { getFirebaseFunctions } from '@/shared/services/firebase/functionsClient';

export type FriendSuggestion = {
  uid: string;
  username: string;
  first: string;
  last: string;
  profilePicUrl: string | null;
  mutualCount: number;
  reasonText: string;
};

type SuggestFriendsResponse = {
  suggestions: FriendSuggestion[];
};

const SUGGESTION_COUNT = 3;

function isCallableUnavailable(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) {
    return false;
  }
  return [
    'functions/not-found',
    'functions/unavailable',
    'functions/internal',
    'functions/deadline-exceeded',
    'functions/failed-precondition',
  ].includes(error.code);
}

async function fetchFromCallable(uid: string, excludeUids: string[]): Promise<FriendSuggestion[]> {
  const callable = httpsCallable<{ excludeUids?: string[] }, SuggestFriendsResponse>(
    getFirebaseFunctions(),
    'suggestFriends',
  );
  const result = await callable({ excludeUids });
  return (result.data.suggestions ?? []).slice(0, SUGGESTION_COUNT);
}

/** Fetches three people to add, ranked by mutual friends then randomized within each tier. */
export async function fetchFriendSuggestions(
  uid: string,
  contactMatches: ContactOnActsMatch[] = [],
): Promise<FriendSuggestion[]> {
  let excludeUids = await getRecentFriendSuggestionUids(uid);

  const load = async (exclude: string[]): Promise<FriendSuggestion[]> => {
    try {
      return await fetchFromCallable(uid, exclude);
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'functions/unauthenticated') {
        throw new Error('SUGGEST_FRIENDS_AUTH');
      }
      if (isCallableUnavailable(error)) {
        return fetchFriendSuggestionsLocal(uid, contactMatches, exclude);
      }
      throw error;
    }
  };

  let suggestions = await load(excludeUids);

  if (suggestions.length === 0 && excludeUids.length > 0) {
    suggestions = await load([]);
  }

  if (suggestions.length === 0) {
    await clearRecentFriendSuggestionUids(uid);
    excludeUids = [];
    suggestions = await load([]);
  }

  if (suggestions.length > 0) {
    await markFriendSuggestionsShown(
      uid,
      suggestions.map((s) => s.uid),
    );
  }

  return suggestions;
}
