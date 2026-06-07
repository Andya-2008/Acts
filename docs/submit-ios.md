# Submit Acts to the App Store (iOS)

Prerequisites: steps 1–3 in `docs/app-store-connect.md` §7 and `docs/test-before-submit.md` complete.

## 0. Preflight (local)

```bash
npm run preflight:store
```

Fix any ✗ failures before building. This checks `.env`, legal URLs, and prints the remaining manual steps.

## 1. Production build

```bash
npm run eas:build:production -- --platform ios
```

Wait for the build on [expo.dev](https://expo.dev). Fix any build failures (usually missing EAS env vars — see `docs/eas-production-checklist.md`).

## 2. Upload to App Store Connect

**Option A — EAS Submit (recommended)**

1. In [App Store Connect](https://appstoreconnect.apple.com) → **Acts** → **App Information**, copy the **Apple ID** (numeric, e.g. `1234567890`).
2. Add to `eas.json` under `submit.production.ios.ascAppId` (see commented example in repo).
3. Run:

```bash
npm run eas:submit:ios:latest
```

Or interactive (no `ascAppId` in eas.json):

```bash
npx eas submit --platform ios --latest
```

**Option B — Manual**

Download the `.ipa` from Expo and upload with **Transporter** (Mac App Store).

## 3. App Store Connect metadata

Open [App Store Connect](https://appstoreconnect.apple.com) → **Acts** → version **1.0.5** (create the version if it does not exist yet).

| Area | Doc |
|------|-----|
| What's New | `docs/app-store-whats-new-1.0.5.md` |
| Description, keywords, subtitle | `docs/app-store-connect.md` §5 |
| Screenshots | `docs/screenshots.md` |
| App Privacy | `docs/app-privacy-questionnaire.md` |
| Demo account + Notes | `docs/app-review-demo-account.md` |
| Privacy URL | `https://acts.app/privacy` (or `https://acts-d7c7f.web.app/privacy`) |
| Support URL | `https://acts.app/support` |

## 4. Select build

On the version page, **Build** → choose the build uploaded in step 2.

## 5. Export compliance

When asked about encryption:

- App uses encryption: **Yes**
- Exempt (standard HTTPS only): **Yes** — matches `ITSAppUsesNonExemptEncryption: false` in the app

## 6. Age rating

Complete the questionnaire — see `docs/app-store-connect.md` §6 (expect **12+** / **13+** with social + UGC).

## 7. Submit for review

1. **Add for Review**
2. Answer any additional questions (advertising ID: No if you have no ads)
3. Wait for status **Waiting for Review** → **In Review**

## 8. If rejected

1. Read **Resolution Center** message carefully.
2. Fix the issue (metadata, demo login, crash, guideline).
3. Upload a new build if code changed; otherwise reply with explanation / new demo password.
4. **Submit again**

## Quick commands

```bash
npm run eas:build:production -- --platform ios
npm run eas:submit -- --platform ios
```
