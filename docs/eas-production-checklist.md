# EAS build & environment checklist

Use this after legal pages are hosted (`docs/legal-hosting.md`). Project: **acts-d7c7f** · EAS ID `c90a1cdf-711c-4542-b42f-c05bd2a82420`.

## 1. Expo environment variables

In [expo.dev](https://expo.dev) → **Acts** → **Environment variables**, set the same keys as `.env.example` for each environment:

| EAS environment | Used by build profile |
|-----------------|------------------------|
| **Preview** | `development`, `preview` |
| **Production** | `production` |

**Visibility:** Plain text or Sensitive for all `EXPO_PUBLIC_*` (not Secret — those are not available when `app.config.js` runs on the build worker).

### Required variables (copy from local `.env`)

**Firebase**

- `EXPO_PUBLIC_FIREBASE_API_KEY` — must start with `AIzaSy` (not `AlzaSy`)
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_API_KEY_IOS` (recommended for iOS)
- `EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID` (recommended for Android)

**Legal**

- `EXPO_PUBLIC_LEGAL_BASE_URL` = `https://acts-d7c7f.web.app` (until `acts.app` DNS is connected — then `https://acts.app`)

**Google Sign-In** (optional on preview if testing email-only)

- `EXPO_PUBLIC_GOOGLE_SIGN_IN_ENABLED` = `true`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

**Sentry** (required for **Production** store builds — no hardcoded DSN in the app)

- `EXPO_PUBLIC_SENTRY_DSN` — from [sentry.io](https://sentry.io) → project → Client Keys (DSN)

**Ads (1.0.7 — leave OFF)**

- `EXPO_PUBLIC_REWARDED_ADS_ENABLED` = `false` or **omit** — no AdMob plugin, no ATT prompt, App Store “Contains Ads” = No

After changing variables, run a **new** build (existing IPAs do not pick up changes).

---

## 2. Build profiles

| Profile | Command | Purpose |
|---------|---------|---------|
| **development** | `npm run eas:build:development -- --platform ios` | Dev client + Google OAuth + native modules |
| **preview** | `npm run eas:build:preview -- --platform ios` | Internal TestFlight-style testing |
| **production** | `npm run eas:build:production -- --platform ios` | App Store / TestFlight production track |

After installing a **development** or **preview** build:

```bash
npm run start:dev-client
```

Open the **Acts** app (not Expo Go).

---

## 3. Firebase (before 1.0.7 store build)

### Phone authentication

Firebase Console → **Authentication** → **Sign-in method** → enable **Phone** (required for SMS verification in 1.0.7).

## 4. Firebase backend deploy

From project root (logged in: `firebase login`):

```bash
npm run firebase:deploy:backend
```

Or step by step:

```bash
firebase deploy --only functions,firestore:rules,storage
npm run firebase:deploy:hosting
```

- **Functions** — push notifications, `resolveLoginIdentifier`, `suggestFriends`, `onInviteSignup`
- **Rules** — Firestore + Storage (challenge photos, login lookup reads require auth)
- **Hosting** — `www/` → `https://acts.app/privacy`, `/terms`, `/support`, `/join` invite page

---

## 5. Before App Store submit

- [ ] Legal URLs load in Safari  
- [ ] `eas build --profile production --platform ios` succeeds  
- [ ] Manual QA — `docs/test-before-submit.md`  
- [ ] Screenshots — `docs/screenshots.md`  
- [ ] App Privacy + demo account — `docs/app-privacy-questionnaire.md`, `docs/app-review-demo-account.md`  
- [ ] Submit — `docs/submit-ios.md`  
- [ ] Firebase App Check: **Off** or **Monitor** unless the app registers App Check  

---

## 6. Quick commands

```bash
# List env (CLI)
eas env:list --environment production

# Production iOS build + submit
npm run eas:build:production -- --platform ios
npm run eas:submit -- --platform ios
```
