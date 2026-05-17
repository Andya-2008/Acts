import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as firebaseAuth from 'firebase/auth';
import type { Auth, Persistence } from 'firebase/auth';

import { getFirebaseWebConfig } from '@/shared/config/env';

type FirebaseAuthNativeAugment = typeof firebaseAuth & {
  getReactNativePersistence: (
    storage: Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>,
  ) => Persistence;
};

const firebaseAuthNative = firebaseAuth as FirebaseAuthNativeAugment;

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

function getOrCreateApp(): FirebaseApp {
  if (appInstance) {
    return appInstance;
  }
  const config = getFirebaseWebConfig();
  appInstance = getApps().length ? getApps()[0]! : initializeApp(config);
  return appInstance;
}

export function getFirebaseApp(): FirebaseApp {
  return getOrCreateApp();
}

export function getFirebaseAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }
  const app = getOrCreateApp();
  if (Platform.OS === 'web') {
    authInstance = firebaseAuth.getAuth(app);
  } else {
    try {
      authInstance = firebaseAuth.initializeAuth(app, {
        persistence: firebaseAuthNative.getReactNativePersistence(AsyncStorage),
      });
    } catch {
      authInstance = firebaseAuth.getAuth(app);
    }
  }
  return authInstance;
}

export function getFirebaseFirestore(): Firestore {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = getFirestore(getOrCreateApp());
  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (storageInstance) {
    return storageInstance;
  }
  storageInstance = getStorage(getOrCreateApp());
  return storageInstance;
}

export function resetFirebaseClientsForTests(): void {
  appInstance = null;
  authInstance = null;
  dbInstance = null;
  storageInstance = null;
}
