# Submit Acts to Google Play (Android)

Prerequisites: Play Console app created, production AAB built, QA on a real device — see `docs/release-1.0.8-android.md` and `docs/test-before-submit-android.md`.

## 0. Preflight (local)

```bash
npm run preflight:store
```

Fix any ✗ failures. Confirm `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` and `EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID` are set in EAS **Production**.

## 1. Google Play Console setup (one-time)

1. [Google Play Console](https://play.google.com/console) → **Create app**
2. **App name:** Acts  
3. **Default language:** English (United States)  
4. **App or game:** App · **Free**

Complete required console sections before production (see `docs/play-store-console.md`):

- App content (privacy policy, ads declaration, content rating, target audience)
- Data safety form
- Store listing (title, descriptions, screenshots)
- App signing (Play App Signing — recommended)

**Package name (fixed):** `com.FrogCOO.Acts` — must match `app.json`.

## 2. Google Sign-In SHA-1 (required for OAuth on release builds)

Play-signed builds use a certificate that differs from your debug keystore.

1. After your first EAS Android production build, run:

   ```bash
   npx eas-cli credentials -p android
   ```

2. Copy the **SHA-1** for the upload / app signing certificate (or from Play Console → **Setup → App signing**).
3. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials?project=acts-d7c7f) → your **Android** OAuth client for `com.FrogCOO.Acts` → add the SHA-1.
4. Confirm `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` in EAS Production matches that client.

Details: `docs/google-sign-in.md` § Android client.

## 3. Service account for EAS Submit

1. Play Console → **Users and permissions** → **Invite new users**
2. Create a [Google Cloud service account](https://cloud.google.com/iam/docs/service-accounts-create) with **Service Account User** if prompted.
3. In Play Console, grant the service account **Release to production, exclude devices, and use Play App Signing** (or at minimum **Release to testing tracks** for internal testing).
4. Download the JSON key → save as **`google-play-service-account.json`** in the project root (gitignored).
5. `eas.json` already points `submit.production.android.serviceAccountKeyPath` at that file.

**First submit:** use `track: "internal"` in `eas.json`, then promote to production in Play Console after QA.

## 4. Production build (AAB)

```bash
npm run eas:build:production:android
```

Or interactively (first time — credential setup):

```bash
npx eas-cli build --profile production --platform android
```

- Profile uses `buildType: "app-bundle"` (required for Play).
- `autoIncrement` bumps `versionCode` on EAS; `app.json` `version` (e.g. **1.0.8**) is the user-facing version.

Wait for the build on [expo.dev](https://expo.dev). Fix failures (usually missing EAS env vars — `docs/eas-production-checklist.md`).

## 5. Upload to Play Console

**Option A — EAS Submit (recommended)**

```bash
npm run eas:submit:android:latest
```

Or with a specific build:

```bash
npx eas-cli submit --profile production --platform android --id <BUILD_ID>
```

**Option B — Manual**

1. Download the `.aab` from Expo.
2. Play Console → **Testing → Internal testing** (or Production) → **Create new release** → upload AAB.

## 6. Store listing & release

| Area | Doc |
|------|-----|
| Console checklist | `docs/play-store-console.md` |
| What's New (1.0.8) | `docs/play-store-whats-new-1.0.8.md` |
| Screenshots | `docs/screenshots.md` § Android |
| Privacy / support URLs | Same as iOS: `https://acts.app/privacy` (or `https://acts-d7c7f.web.app/privacy`) |
| Demo / test instructions | `docs/app-review-demo-account.md` (adapt for Play reviewers) |

## 7. Rollout

1. **Internal testing** → install via opt-in link → run `docs/test-before-submit-android.md`.
2. Promote to **Closed testing** or **Production** when ready.
3. Choose staged rollout % if desired.

## 8. After publish

- Update invite landing if needed (`www/join.html` already links to Play on Android).
- Optional: add Play Store link to marketing site.
- In-app **update prompt** is iOS-only today (`AppStoreUpdatePrompt`); add Play version check in a future release if desired.

## Quick commands

```bash
npm run eas:build:production:android
npm run eas:submit:android:latest
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `serviceAccountKeyPath` file not found | Place JSON at repo root as `google-play-service-account.json` or pass `--path` to `eas submit` |
| Google Sign-In fails on release build | Add Play / EAS SHA-1 to Android OAuth client |
| `versionCode` already used | EAS `autoIncrement` should prevent this; bump manually in Play if you uploaded outside EAS |
| Widgets missing on home screen | Long-press launcher → Widgets → Acts streak / Acts to do |
