# Release 1.0.5 — ship checklist

App version in `app.json`: **1.0.5** (1.0.4 skipped). EAS production uses `autoIncrement` for build numbers.

## 0. Backend (do first)

Username/phone sign-in and several features depend on deployed Firebase resources.

```bash
npm run firebase:deploy:backend
npm run firebase:deploy:hosting
```

| Deploy | Why |
|--------|-----|
| **Functions** | `resolveLoginIdentifier` callable; friend-request push `screen: friends` |
| **Firestore rules** | `usernames` / `phoneLoginLookup` no longer public read |
| **Storage rules** | `season_challenge_photos/` |
| **Hosting** | `/join` invite landing |

## 1. EAS environment

```bash
npm run preflight:store
npm run eas:env:hints
```

- [ ] All `EXPO_PUBLIC_*` from `.env` in **Preview** and **Production** on [expo.dev](https://expo.dev)
- [ ] **`EXPO_PUBLIC_SENTRY_DSN`** in **Production** (and Preview if you want crashes there) — see `docs/eas-production-checklist.md`
- [ ] `EXPO_PUBLIC_LEGAL_BASE_URL` points at live hosting (`https://acts-d7c7f.web.app` or `https://acts.app`)

## 2. Production build

**Build 16** (check status on Expo):  
https://expo.dev/accounts/andrewhyun114/projects/acts/builds/204e67db-6d5b-4640-8b7e-1acac7990cc5  
While it runs → **`docs/while-build-runs.md`**

```bash
npm run eas:build:production -- --platform ios
```

Optional internal pass first:

```bash
npm run eas:build:preview -- --platform ios
```

## 3. QA on the production (or preview) binary

Use **`docs/test-before-submit.md`**, plus 1.0.5-specific checks:

- [ ] Sign in with **username** and **phone** (not only email) — needs Functions + rules deployed
- [ ] Invite share opens `/join?invitedBy=`; friend reward after accept
- [ ] First-act spotlight on Tasks (new account)
- [ ] Push / inbox notification opens correct screen (deed highlight, Friends)
- [ ] Seasonal challenge: optional photo on log
- [ ] Midnight Studio (or dark theme): task chips and deed cards readable

## 4. App Store Connect

- [ ] What's New copy — paste from **`docs/app-store-whats-new-1.0.5.md`**
- [ ] Screenshots — `docs/screenshots.md`
- [ ] Privacy / demo account — `docs/app-privacy-questionnaire.md`, `docs/app-review-demo-account.md`

## 5. Submit

```bash
npm run eas:submit -- --platform ios
```

Then **Add for Review** — `docs/submit-ios.md`

## What's in 1.0.5 (reference)

- Grow-friends empty states + invite rewards + `/join` landing
- First-act onboarding spotlight
- Notification deep linking (deed feed scroll + highlight)
- Theme polish (Midnight Studio chips, deed card tints)
- Seasonal challenge optional photos
- Login: callable identifier resolution (security)

## Still open (not blocking this build)

- `registeredContactKeys` PII — monitor
- Session replay in Sentry — policy decision only
- Android Play launch — separate from this iOS 1.0.5 submit
