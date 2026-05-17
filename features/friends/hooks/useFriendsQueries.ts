import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { friendsQueryKeys } from '@/features/friends/queryKeys';
import type { FriendshipRelation } from '@/features/friends/services/friendsRepository';
import {
  acceptFriendRequest,
  cancelOutgoingFriendRequest,
  declineFriendRequest,
  fetchFriendshipRelation,
  fetchFriends,
  fetchFriendUids,
  fetchIncomingFriendRequests,
  fetchMutualFriends,
  fetchOutgoingFriendRequests,
  removeFriend,
  sendFriendRequest,
  sendFriendRequestToUid,
} from '@/features/friends/services/friendsRepository';

export function useIncomingFriendRequestsQuery(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? friendsQueryKeys.incoming(uid) : [...friendsQueryKeys.all, '__none__'],
    queryFn: () => fetchIncomingFriendRequests(uid!),
    enabled: Boolean(uid),
    staleTime: 10_000,
  });
}

export function useOutgoingFriendRequestsQuery(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? friendsQueryKeys.outgoing(uid) : [...friendsQueryKeys.all, '__none__'],
    queryFn: () => fetchOutgoingFriendRequests(uid!),
    enabled: Boolean(uid),
    staleTime: 10_000,
  });
}

export function useFriendsListQuery(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? friendsQueryKeys.edges(uid) : [...friendsQueryKeys.all, '__none__'],
    queryFn: () => fetchFriends(uid!),
    enabled: Boolean(uid),
    staleTime: 15_000,
  });
}

export function useFriendUidsQuery(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? friendsQueryKeys.friendUids(uid) : [...friendsQueryKeys.all, '__friendUids_none__'],
    queryFn: () => fetchFriendUids(uid!),
    enabled: Boolean(uid),
    staleTime: 15_000,
  });
}

function invalidateFriends(qc: QueryClient, uid: string | undefined) {
  if (!uid) {
    return;
  }
  void qc.invalidateQueries({ queryKey: friendsQueryKeys.incoming(uid) });
  void qc.invalidateQueries({ queryKey: friendsQueryKeys.outgoing(uid) });
  void qc.invalidateQueries({ queryKey: friendsQueryKeys.edges(uid) });
  void qc.invalidateQueries({ queryKey: friendsQueryKeys.friendUids(uid) });
  void qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'friends' &&
      q.queryKey[1] === 'relation' &&
      (q.queryKey[2] === uid || q.queryKey[3] === uid),
  });
  void qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'friends' &&
      q.queryKey[1] === 'mutual' &&
      (q.queryKey[2] === uid || q.queryKey[3] === uid),
  });
}

export function useFriendshipRelationQuery(meUid: string | undefined, profileUid: string | undefined) {
  return useQuery({
    queryKey:
      meUid && profileUid
        ? friendsQueryKeys.relation(meUid, profileUid)
        : [...friendsQueryKeys.all, '__relation_none__'],
    queryFn: () => fetchFriendshipRelation(meUid!, profileUid!),
    enabled: Boolean(meUid && profileUid),
    staleTime: 10_000,
  });
}

export function useMutualFriendsQuery(
  meUid: string | undefined,
  profileUid: string | undefined,
  relation: FriendshipRelation | undefined,
) {
  const enabled =
    Boolean(meUid && profileUid) && meUid !== profileUid && relation === 'friends';
  return useQuery({
    queryKey:
      meUid && profileUid
        ? friendsQueryKeys.mutualFriends(meUid, profileUid)
        : [...friendsQueryKeys.all, '__mutual_none__'],
    queryFn: () => fetchMutualFriends(meUid!, profileUid!),
    enabled,
    staleTime: 30_000,
  });
}

export function useSendFriendRequestToUidMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toUid: string) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      return sendFriendRequestToUid(uid, toUid);
    },
    onSuccess: async () => {
      invalidateFriends(qc, uid);
    },
  });
}

export function useSendFriendRequestMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      return sendFriendRequest(uid, username);
    },
    onSuccess: async () => {
      invalidateFriends(qc, uid);
    },
  });
}

export function useAcceptFriendRequestMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fromUid: string) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      return acceptFriendRequest(uid, fromUid);
    },
    onSuccess: async () => {
      invalidateFriends(qc, uid);
    },
  });
}

export function useDeclineFriendRequestMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fromUid: string) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      return declineFriendRequest(uid, fromUid);
    },
    onSuccess: async () => {
      invalidateFriends(qc, uid);
    },
  });
}

export function useCancelOutgoingFriendRequestMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toUid: string) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      return cancelOutgoingFriendRequest(uid, toUid);
    },
    onSuccess: async () => {
      invalidateFriends(qc, uid);
    },
  });
}

export function useRemoveFriendMutation(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendUid: string) => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      return removeFriend(uid, friendUid);
    },
    onSuccess: async () => {
      invalidateFriends(qc, uid);
    },
  });
}
