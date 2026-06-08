# Release 1.0.7 — ship checklist

App version in `app.json`: **1.0.7**. EAS production uses `autoIncrement` for build numbers.

**Monetization:** This release ships **without ads**. Keep `EXPO_PUBLIC_REWARDED_ADS_ENABLED=false` (or unset) in EAS Production. App Store → **Contains Ads** = **No**.

## 0. Firebase (do first)

### Phone SMS verification (required for 1.0.7)

1. [Firebase Console](https://console.firebase.google.com) → **Authentication** → **Sign-in method** → enable **Phone**.
2. For production SMS, configure your Firebase billing plan (Blaze) if you hit the free SMS quota on the Spark plan.

### Backend deploy

```bash
npm run firebase:deploy:backend
npm run firebase:deploy:hosting
```

| Deploy | Why |
|--------|-----|
| **Functions** | Login identifier resolution; push notification payloads |
| **Firestore rules** | Profile, friends, phone lookup security |
| **Hosting** | `/join` invite landing, legal pages |

## 1. EAS environment

```bash
npm run preflight:store
npm run eas:env:hints
```

- [ ] All `EXPO_PUBLIC_*` from `.env` in **Preview** and **Production** on [expo.dev](https://expo.dev)
- [ ] **`EXPO_PUBLIC_SENTRY_DSN`** in **Production** — see `docs/eas-production-checklist.md`
- [ ] **`EXPO_PUBLIC_REWARDED_ADS_ENABLED`** is **false** or **unset** in Production (no AdMob plugin, no tracking prompt)
- [ ] `EXPO_PUBLIC_LEGAL_BASE_URL` points at live hosting (`https://acts-d7c7f.web.app` or `https://acts.app`)

## 2. Production build

**First build with widgets:** EAS needs a provisioning profile for `ActsWidgetExtension` (`com.FrogCOO.Acts.ActsWidgetExtension`). Run the build **once in interactive mode** so credentials can be created:

```bash
npx eas-cli build --profile production --platform ios
```

Later builds can use `--non-interactive`.

```bash
npm run eas:build:production
```

Optional internal pass first:

```bash
npm run eas:build:preview -- --platform ios
```

While the build runs → **`docs/while-build-runs.md`**

## 3. QA on the production (or preview) binary

Use **`docs/test-before-submit.md`**, plus 1.0.7-specific checks:

- [ ] **Sign up** with email/password → mobile number required → SMS code → profile created
- [ ] **Google/Apple sign-in** → verify-phone screen → SMS → enter app
- [ ] **Returning user** without verified Auth phone → redirected to verify-phone on launch
- [ ] **Home screen widgets** — add Acts streak / tasks widget; complete an act; widget updates
- [ ] **Rewards** tab title (was Shop); seeds purchases still work (virtual currency only)
- [ ] **What's new** overlay appears once on 1.0.7
- [ ] **App Store update prompt** — only appears when a newer store version exists (optional to test)
- [ ] **Profile photo crop** — pick photo → crop square → saves
- [ ] **No ad UI** anywhere in the app

## 4. App Store Connect

- [ ] What's New copy — paste from **`docs/app-store-whats-new-1.0.7.md`**
- [ ] **Contains Ads** = **No**
- [ ] **Tracking** = **No** (no ATT prompt in this build)
- [ ] Demo account notes updated for SMS verification — `docs/app-review-demo-account.md`
- [ ] Screenshots — `docs/screenshots.md` (update if widgets are featured)

## 5. Submit

```bash
npm run eas:submit -- --platform ios
```

Then **Add for Review** — `docs/submit-ios.md`

## What's in 1.0.7 (reference)

- Required mobile number + SMS verification (sign-up and OAuth gate)
- iOS + Android home screen widgets (streak, suggested acts)
- Rewards rename (Kindness Arcade UI)
- In-app App Store update prompt
- Profile photo square crop on pick
- Release highlights walkthrough for 1.0.7
- Ads **disabled** — no AdMob native module in this build profile

## Still open (not blocking this build)

- Android Play launch — separate from this iOS 1.0.7 submit
- Change-phone flow in Settings (verified numbers are read-only for now)
- Rewarded ads — flip `EXPO_PUBLIC_REWARDED_ADS_ENABLED=true` only in a future monetized release
