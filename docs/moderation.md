# Deed post reports (`deedReports`)

Users submit reports from the deed feed; documents live in the top-level Firestore collection **`deedReports`**.

## Who can read reports?

Normal app users **cannot** read this collection. Only accounts with the Firebase Auth **custom claim** `actsModerator` set to `true` may **read** (including listing the collection). Writes from clients are still **create-only** for the reporter; updates and deletes stay denied for everyone (handle triage in Admin SDK / Cloud Functions if needed).

## Granting moderator access

Use the [Firebase Admin SDK](https://firebase.google.com/docs/auth/admin/custom-claims) (Node script, Cloud Function, or `firebase auth:export` is not enough—you must set claims programmatically).

Example (Node):

```js
const admin = require('firebase-admin');
admin.initializeApp();

async function setModerator(uid, isModerator) {
  const user = await admin.auth().getUser(uid);
  await admin.auth().setCustomUserClaims(uid, {
    ...(user.customClaims ?? {}),
    actsModerator: isModerator,
  });
}

void setModerator('THE_STAFF_USER_UID', true);
```

After setting claims, the user must **sign out and sign in again** (or refresh their ID token) before Firestore rules see `actsModerator`.

## Deploy rules

```bash
firebase deploy --only firestore:rules
```

## Querying in a staff tool

Use the Firebase Admin SDK or a small internal web app where staff sign in with Google (or email) and you attach `actsModerator` only to vetted UIDs. Do not ship moderator credentials in the consumer mobile app.
