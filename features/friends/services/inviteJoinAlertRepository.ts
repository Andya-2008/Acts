import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import { firestoreCollections } from '@/shared/config/firestore';
import { getFirebaseFirestore } from '@/shared/services/firebase/client';

export type InviteJoinAlert = {
  newUserUid: string;
  joinerDisplayName?: string;
};

export function subscribeInviteJoinAlerts(
  inviterUid: string,
  onChange: (alerts: InviteJoinAlert[]) => void,
): Unsubscribe {
  const db = getFirebaseFirestore();
  const col = collection(db, firestoreCollections.userInfo, inviterUid, 'inviteJoinAlerts');

  return onSnapshot(
    col,
    (snap) => {
      const alerts = snap.docs
        .map((d) => {
          const data = d.data();
          const createdAtMs =
            typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : 0;
          return {
            newUserUid: d.id,
            joinerDisplayName:
              typeof data.joinerDisplayName === 'string' ? data.joinerDisplayName.trim() : undefined,
            createdAtMs,
          };
        })
        .sort((a, b) => b.createdAtMs - a.createdAtMs)
        .map(({ newUserUid, joinerDisplayName }) => ({ newUserUid, joinerDisplayName }));
      onChange(alerts);
    },
    () => {
      onChange([]);
    },
  );
}

export async function dismissInviteJoinAlert(inviterUid: string, newUserUid: string): Promise<void> {
  const db = getFirebaseFirestore();
  await deleteDoc(
    doc(db, firestoreCollections.userInfo, inviterUid, 'inviteJoinAlerts', newUserUid),
  );
}
