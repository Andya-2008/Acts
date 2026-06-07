import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
  type User,
} from 'firebase/auth';

import { getFirebaseAuth } from '@/shared/services/firebase/client';

export function userHasPasswordProvider(user: User | null | undefined): boolean {
  return Boolean(user?.providerData?.some((p) => p.providerId === 'password'));
}

export async function reauthenticateWithPassword(currentEmail: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not signed in');
  }
  const email = currentEmail.trim();
  if (!email.includes('@')) {
    throw new Error('EMAIL_CHANGE_NO_EMAIL');
  }
  const credential = EmailAuthProvider.credential(email, password);
  await reauthenticateWithCredential(user, credential);
}

/** Sends a verification link to the new address; Firebase applies the change after the user confirms. */
export async function requestVerifiedEmailChange(newEmail: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('EMAIL_CHANGE_NO_EMAIL');
  }
  if (!userHasPasswordProvider(user)) {
    throw new Error('EMAIL_CHANGE_OAUTH_MANAGED');
  }

  const nextEmail = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    throw new Error('EMAIL_CHANGE_INVALID');
  }
  if (nextEmail === user.email.trim().toLowerCase()) {
    throw new Error('EMAIL_CHANGE_SAME');
  }

  await reauthenticateWithPassword(user.email, password);
  await verifyBeforeUpdateEmail(user, nextEmail);
}

export async function changePasswordForUser(currentPassword: string, newPassword: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('PASSWORD_CHANGE_NO_EMAIL');
  }
  if (!userHasPasswordProvider(user)) {
    throw new Error('PASSWORD_CHANGE_OAUTH_MANAGED');
  }

  const nextPassword = newPassword.trim();
  if (nextPassword.length < 8) {
    throw new Error('PASSWORD_CHANGE_TOO_SHORT');
  }
  if (nextPassword === currentPassword) {
    throw new Error('PASSWORD_CHANGE_SAME');
  }

  await reauthenticateWithPassword(user.email, currentPassword);
  await updatePassword(user, nextPassword);
}
