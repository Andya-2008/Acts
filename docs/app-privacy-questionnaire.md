# App Store Connect — App Privacy

Complete **App Privacy** in App Store Connect before submit. Answers must match the app and your [Privacy Policy](https://acts.app/privacy).

## Third-party partners

| Partner | Purpose |
|---------|---------|
| Google Firebase | Authentication, database (Firestore), file storage |

## Data types (typical for Acts v1.0)

Use Apple’s exact categories in the wizard. Suggested mapping:

| Data type | Collected | Linked to identity | Tracking | Purpose |
|-----------|-----------|-------------------|----------|---------|
| Email address | Yes | Yes | No | App functionality, account |
| Name | Yes | Yes | No | App functionality |
| Phone number | Required (SMS verified) | Yes | No | App functionality (account security, sign-in, friend matching) |
| User ID | Yes | Yes | No | App functionality |
| Photos or videos | Yes | Yes | No | App functionality (profile, tasks, deed feed) |
| Other user content | Yes | Yes | No | App functionality (posts, comments) |
| Contacts | Optional | Yes | No | App functionality (find friends on Acts) |
| Product interaction | Optional | Yes | No | App functionality (if you treat in-app actions as this) |

**Tracking:** No (unless you add ads or cross-app tracking SDKs later).

**Data used to track you:** No.

## Practices to confirm in-app

- Users can **delete account** (Settings → Account).
- Users can **block** and **report** UGC (deed feed).
- **Contacts** are only read when the user taps Find friends from contacts.
- **Notifications** are optional (local reminders).

## Privacy Policy URL

Must match the policy you host:

- Production: `https://acts.app/privacy`
- Interim (Firebase default): `https://acts-d7c7f.web.app/privacy`

## After app changes

If you add analytics, ads, or new data collection, update both the questionnaire and `www/privacy.html`, then redeploy hosting.
