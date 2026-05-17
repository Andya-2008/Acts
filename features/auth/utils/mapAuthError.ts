import { FirebaseError } from 'firebase/app';

const codeMap: Record<string, string> = {
  'permission-denied':
    'Firestore blocked this write. Common causes: (1) Firebase Console → App Check → Firestore: if enforcement is Enforced, switch to Off or Monitor until the app registers App Check (rules deploy alone will not fix that). (2) Deploy these rules to the same project as EXPO_PUBLIC_FIREBASE_PROJECT_ID: `firebase deploy --only firestore:rules`, or paste `firestore.rules` into Firebase → Firestore → Rules and publish. (3) Confirm you are still signed in.',
  'storage/unauthorized':
    'Upload was blocked by Storage rules. Deploy this repo’s rules: `firebase deploy --only storage` (or paste `storage.rules` into Firebase Console → Storage → Rules → Publish). Task photos use `task_photos/{your uid}/{taskDocId}.jpg`; profile photos use `profile_pictures/{your uid}.png`.',
  'auth/email-already-in-use':
    'That email is already registered. Use Sign in with this email instead. If you already tried and saw “Profile not found,” your Firebase login exists but Acts never saved a profile—sign up with a different email, or delete that user under Firebase Authentication → Users and try again.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/weak-password': 'Choose a stronger password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account matches that email, username, or phone.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect sign-in or password.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/too-many-requests': 'Too many attempts. Try again shortly.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/requires-recent-login':
    'For your security, sign out, sign in again, then retry deleting your account.',
};

export function mapAuthError(error: unknown): string {
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
      GOOGLE_EMAIL_REQUIRED: 'This Google account has no email on file. Use a different Google account or email sign-up.',
      PROFILE_EMAIL_REQUIRED_FOR_USERNAME_CLAIM:
        'Cannot save profile without an email. Try again or contact support if this persists.',
    };
    if (loginIdMsg[error.message]) {
      return loginIdMsg[error.message]!;
    }
  }
  if (error instanceof FirebaseError && codeMap[error.code]) {
    return codeMap[error.code]!;
  }
  if (error instanceof Error) {
    if (error.message === 'USERNAME_TAKEN') {
      return 'That username is already taken.';
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
