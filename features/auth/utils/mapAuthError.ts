import { FirebaseError } from 'firebase/app';

export const REACTION_PERMISSION_DENIED_MESSAGE =
  "We couldn't save your reaction (permission denied). Pull to refresh, then try again. If it still fails, force-quit Acts and reopen so the latest app code loads.";

const authCodeMap: Record<string, string> = {
  'auth/email-already-in-use':
    'That email is already registered. Sign in instead, or use a different email to create a new account.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/weak-password': 'Choose a stronger password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account matches that email, username, or phone.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect sign-in or password.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
  'auth/credential-already-in-use':
    'An account already exists with this email using a different sign-in method.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/too-many-requests': 'Too many attempts. Try again shortly.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/requires-recent-login': 'For your security, sign out, sign in again, then retry.',
  'auth/invalid-verification-code': 'That verification code is incorrect. Check the text message and try again.',
  'auth/code-expired': 'That code expired. Send a new verification code and try again.',
  'auth/missing-verification-code': 'Enter the 6-digit code from your text message.',
  'auth/invalid-phone-number': 'That phone number looks invalid. Check the number and try again.',
  'auth/quota-exceeded': 'SMS verification is temporarily unavailable. Try again later.',
  'auth/captcha-check-failed': 'Verification check failed. Try sending the code again.',
};

const otherCodeMap: Record<string, string> = {
  'permission-denied': "You don't have permission to complete this action.",
  'storage/unauthorized': "We couldn't upload that file. Check your connection and try again.",
};

function getFirebaseErrorCode(error: unknown): string | null {
  if (error instanceof FirebaseError) {
    return error.code;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string') {
      return code;
    }
  }
  if (error instanceof Error) {
    const match = error.message.match(/\((auth\/[^)]+)\)/);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

function messageForFirebaseCode(code: string, permissionDeniedMessage: string): string | null {
  if (authCodeMap[code]) {
    return authCodeMap[code]!;
  }
  if (code === 'permission-denied') {
    return permissionDeniedMessage;
  }
  return otherCodeMap[code] ?? null;
}

type MapAuthErrorOptions = {
  /** Override Firestore `permission-denied` copy (e.g. deed reactions). */
  permissionDeniedMessage?: string;
};

export function mapAuthError(error: unknown, options?: MapAuthErrorOptions): string {
  const permissionDeniedMessage = options?.permissionDeniedMessage ?? otherCodeMap['permission-denied']!;

  if (error instanceof Error) {
    const loginIdMsg: Record<string, string> = {
      LOGIN_IDENTIFIER_EMPTY: 'Enter your email, username, or phone number.',
      LOGIN_INVALID_EMAIL: 'Enter a valid email address.',
      LOGIN_PHONE_INVALID: 'Enter a valid phone number (at least 10 digits).',
      LOGIN_PHONE_NOT_FOUND:
        'No password account matches that phone on Acts yet. Sign in with email once after saving your phone on your profile, or use your email here.',
      LOGIN_USERNAME_SHORT: 'Username must be at least 3 characters.',
      LOGIN_USERNAME_NOT_FOUND: 'No Acts user has that username.',
      LOGIN_USERNAME_NO_EMAIL:
        'That username cannot sign in yet. Sign in with your email once so Acts can link this username, then try again.',
      LOGIN_RATE_LIMIT: 'Too many sign-in lookups. Wait a minute and try again.',
      EMAIL_CHANGE_NO_EMAIL: 'No email is on file for this account.',
      EMAIL_CHANGE_OAUTH_MANAGED:
        'This email is managed by Google or Apple sign-in. Change it in your Apple ID or Google account settings.',
      EMAIL_CHANGE_INVALID: 'Enter a valid email address.',
      EMAIL_CHANGE_SAME: 'That is already your email address.',
      EMAIL_CHANGE_SENT:
        'Check your new email inbox for a verification link. Your sign-in email updates after you confirm.',
      PASSWORD_CHANGE_NO_EMAIL: 'No email is on file for this account.',
      PASSWORD_CHANGE_OAUTH_MANAGED:
        'This account signs in with Google or Apple. Manage your password in your Apple ID or Google account settings.',
      PASSWORD_CHANGE_TOO_SHORT: 'Use at least 8 characters.',
      PASSWORD_CHANGE_SAME: 'Choose a password different from your current one.',
      PASSWORD_CHANGE_MISMATCH: 'New passwords do not match.',
      USERNAME_UNCHANGED: 'That is already your username.',
      USERNAME_INVALID: 'Usernames use 3–20 letters, numbers, or underscores.',
      PHONE_TAKEN:
        'That phone number is already linked to another Acts account. Sign in with that account or use a different number.',
      PHONE_INVALID: 'Enter a valid mobile number with at least 10 digits.',
      PHONE_VERIFY_REQUIRED: 'Verify your mobile number before continuing.',
      PHONE_VERIFY_FAILED: 'We could not confirm your number. Try sending a new code.',
      PHONE_RECAPTCHA_NOT_READY: 'Verification is still starting up. Wait a moment and try again.',
      PROFILE_NOT_FOUND: 'We could not load your profile. Pull to refresh and try again.',
      GOOGLE_EMAIL_REQUIRED:
        'This Google account has no email on file. Use a different Google account or email sign-up.',
      APPLE_EMAIL_REQUIRED:
        'This Apple account has no email on file. In Apple ID settings, allow email sharing for Acts, or use email sign-up.',
      APPLE_IDENTITY_TOKEN_MISSING:
        'We could not complete Sign in with Apple. Please try again or sign in with email and password.',
      GOOGLE_PROFILE_SETUP_FAILED:
        'Signed in with Google, but we could not create your Acts profile. Check your connection and try again.',
      PROFILE_EMAIL_REQUIRED_FOR_USERNAME_CLAIM:
        'Cannot save profile without an email. Try again or contact support if this persists.',
      FEED_REACTIONS_DISABLED:
        'Reactions are turned off for this deed. The author can enable them from the post menu (⋯).',
      FEED_REACTIONS_VIEWER_OFF:
        'Reactions are off in your privacy settings. Turn them on under Settings → Privacy.',
      DEED_POST_NOT_FOUND: 'This deed post is no longer available. Pull to refresh the feed.',
      FRIEND_LOOKUP_NOT_FOUND:
        'No Acts user matches that username, email, or phone. They may need to add that info on their profile first.',
    };
    if (loginIdMsg[error.message]) {
      return loginIdMsg[error.message]!;
    }
    if (error.message === 'USERNAME_TAKEN') {
      return 'That username is already taken.';
    }
    if (error.message === 'ERR_REQUEST_CANCELED') {
      return 'Sign-in was cancelled.';
    }
  }

  const code = getFirebaseErrorCode(error);
  if (code) {
    const mapped = messageForFirebaseCode(code, permissionDeniedMessage);
    if (mapped) {
      return mapped;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function mapReactionError(error: unknown): string {
  return mapAuthError(error, { permissionDeniedMessage: REACTION_PERMISSION_DENIED_MESSAGE });
}
