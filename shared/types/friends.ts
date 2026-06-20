import type { Timestamp } from 'firebase/firestore';

/** `userInfo/{uid}/friends/{friendUid}` */
export type FriendEdgeDoc = {
  friendUid: string;
  Username: string;
  First: string;
  Last: string;
  since: Timestamp | null;
  /** Uid of the user who tapped Accept when this edge was created. */
  acceptedByUid?: string;
};

/** `userInfo/{toUid}/friendRequestsIncoming/{fromUid}` */
export type FriendRequestIncomingDoc = {
  fromUid: string;
  status: 'pending';
  createdAt: Timestamp | null;
};

/** `userInfo/{fromUid}/friendRequestsOutgoing/{toUid}` */
export type FriendRequestOutgoingDoc = {
  toUid: string;
  status: 'pending';
  createdAt: Timestamp | null;
};
