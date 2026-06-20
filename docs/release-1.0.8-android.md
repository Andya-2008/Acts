# Release 1.0.8 — Android (Google Play) ship checklist

App version in `app.json`: **1.0.8**. EAS production uses `autoIncrement` for Android `versionCode`.

**Monetization:** Same as iOS — **no ads**. Keep `EXPO_PUBLIC_REWARDED_ADS_ENABLED=false` in EAS Production.

## 0. Firebase & backend

```bash
npm run firebase:deploy:backend
```

Social push notifications require deployed Cloud Functions (`onFriendRequest`, `onDeedPost`, `onFriendAccepted`, etc.).

## 1. EAS environment

```bash
npm run preflight:store
npm run eas:env:hints
```

- [ ] All `EXPO_PUBLIC_*` from `.env` in **Preview** and **Production** on [expo.dev](https://expo.dev)
- [ ] **`EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID`** in Production
- [ ] **`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`** in Production
- [ ] **`EXPO_PUBLIC_SENTRY_DSN`** in Production
- [ ] **`EXPO_PUBLIC_REWARDED_ADS_ENABLED`** false or unset

## 2. Google Play Console (one-time)

- [ ] App created with package `com.FrogCOO.Acts`
- [ ] Store listing draft — `docs/play-store-console.md`
- [ ] Content rating, Data safety, Ads = No
- [ ] Service account for EAS Submit — `docs/submit-android.md` §3

## 3. Production build

```bash
npm run eas:build:production:android
```

First build: run interactively if EAS needs to create a keystore.

Optional internal pass:

```bash
npm run eas:build:preview -- --platform android
```

## 4. Google Sign-In on release build

After first production build:

1. `npx eas-cli credentials -p android` → copy SHA-1  
2. Add to Android OAuth client — `docs/google-sign-in.md`  
3. Rebuild if you had to fix OAuth before first test

## 5. QA on device

**`docs/test-before-submit-android.md`**

## 6. Submit

1. Place `google-play-service-account.json` in repo root (gitignored).
2. Confirm `eas.json` → `submit.production.android.track` (`internal` for first upload).
3. Run:

```bash
npm run eas:submit:android:latest
```

4. Play Console → complete release → roll out internal testing.

Full steps: **`docs/submit-android.md`**

## 7. Promote to production

- [ ] Release notes — `docs/play-store-whats-new-1.0.8.md`
- [ ] Screenshots — `docs/screenshots.md` § Android
- [ ] Internal QA passed → promote track or create production release

## Parity with iOS 1.0.8

| Feature | Android |
|---------|---------|
| Home screen widgets (streak + tasks) | Yes |
| Optional phone / no SMS gate | Yes |
| Social push notifications | Yes (Expo push + Cloud Functions) |
| Google Sign-In | Yes |
| Apple Sign-In | N/A (iOS only) |
| In-app App Store update prompt | iOS only (Play check TBD) |

## Hosting

Deploy `/join` updates for Play Store button on Android:

```bash
npm run firebase:deploy:hosting
```
