export const firestoreCollections = {
  userInfo: 'userInfo',
  usernames: 'usernames',
  /** Public read by phone key: maps normalized phone → Firebase Auth email for password sign-in. */
  phoneLoginLookup: 'phoneLoginLookup',
  registeredContactKeys: 'registeredContactKeys',
  tasks: 'tasks',
  deeds: 'deeds',
  deedPosts: 'deedPosts',
  becomeCategories: 'becomeCategories',
  achievements: 'achievements',
  notifications: 'notifications',
} as const;

export type FirestoreCollectionName = (typeof firestoreCollections)[keyof typeof firestoreCollections];
