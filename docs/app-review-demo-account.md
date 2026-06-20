# App Review demo account

Apple requires sign-in credentials they can use without contacting you. Create a **dedicated** account — not your personal Acts account.

## 1. Create the account

1. Install a **production** or **preview** iOS build (not Expo Go).
2. Sign up with a new email you control, e.g. `acts.review+apple@yourdomain.com`.
3. Complete signup (no SMS verification required in 1.0.8).
4. On **Invite a friend**: tap **Continue** after sharing or adding someone, or tap **✕** (top left) to skip.
5. Open **Tasks** and complete at least one act (optional but helps reviewers see the core loop).
6. Optional: add a profile photo under **Settings → Account** (square crop when picking).
7. Optional: add a mobile number under **Settings → Account** if you want reviewers to test contact matching.

**Do not** enable 2FA on this account unless you document it for Apple.

## 2. Pre-seed (recommended)

Makes review smoother:

| Goal | How |
|------|-----|
| See deed feed | Add a second test user as a friend, or complete an act and share to deed feed |
| See social features | Send one friend request from the demo account to your personal account and accept |
| Avoid empty states | Complete 1–2 tasks before submit |

## 3. Paste into App Store Connect

**App Review Information → Notes** (update bracketed fields):

```
Acts — App Review test account

Sign-in: Email and password (required). Username or phone also work if set on this account.
Username: [demo username shown in Settings → Account]

Email: [REVIEW_EMAIL]
Password: [REVIEW_PASSWORD]

How to explore:
1. Sign in with the credentials above.
2. If “Invite a friend” appears: tap ✕ (top left) to skip, or complete one option and tap Continue.
3. Tasks tab — suggested acts; new accounts may see a “first act” highlight; tap to mark complete.
4. Deed Feed tab — posts from friends (may be empty if no friends; that is OK).
5. Profile tab — service rank and stats.
6. Settings — Privacy, notifications, Account (includes Delete account).

Google Sign-In: [USE ONE LINE BELOW]
- Available in this build — reviewers may use Google or email.
- Not available — use email/password only.

Optional permissions (can deny):
- Contacts — only if using Find friends from contacts
- Photos / Camera — only for profile or task photos
- Notifications — optional reminders

Support: https://acts.app/support (or https://acts-d7c7f.web.app/support)
Privacy: https://acts.app/privacy
```

## 4. Sign-in required

In App Store Connect → **Sign-in required**: **Yes**.

Provide the same email/password in the **demo account** fields if Apple shows separate username/password boxes.

## 5. After rejection

If Apple says they cannot sign in:

- Confirm the account still exists in Firebase Authentication.
- Reset password to a new value and reply in Resolution Center with updated credentials.
- Confirm Production EAS env vars include valid `EXPO_PUBLIC_FIREBASE_*` keys.

**Never commit real passwords to git.** Keep credentials in App Store Connect and your password manager only.
