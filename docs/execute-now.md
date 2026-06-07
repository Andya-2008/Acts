# Execute now — ship checklist

You are past planning. Do these in order (check off as you go).

**Shipping 1.0.5?** Use **`docs/release-1.0.5.md`** (backend deploy + feature QA) instead of this generic list.

## A. Environment (30 min)

```bash
npm run preflight:store          # must pass legal URLs (web.app OK)
npm run eas:env:hints            # copy commands → set Preview + Production on expo.dev
```

- [ ] Every `EXPO_PUBLIC_*` from `.env` exists in **both** EAS Preview and Production
- [ ] `EXPO_PUBLIC_FIREBASE_API_KEY` starts with `AIzaSy` in EAS UI

## B. Device build (1–2 hours, mostly waiting)

```bash
npm run eas:build:production -- --platform ios
```

Install via TestFlight or the EAS install link when the build finishes.

## C. QA on that build

Follow **`docs/test-before-submit.md`** — minimum:

- [ ] Sign up / sign in
- [ ] Friends gate skip (✕) or Continue
- [ ] Complete one task
- [ ] Settings → About → Privacy, Terms, Support open in Safari
- [ ] **Delete account** on a throwaway test user

## D. App Review demo account

**`docs/app-review-demo-account.md`** — create account on the production build, paste credentials into App Store Connect → Review Notes.

## E. App Store Connect assets

- [ ] Screenshots — **`docs/screenshots.md`**
- [ ] Description / keywords — **`docs/app-store-connect.md` §5**
- [ ] App Privacy — **`docs/app-privacy-questionnaire.md`**
- [ ] Privacy URL: `https://acts-d7c7f.web.app/privacy` (or `https://acts.app/privacy` after DNS)
- [ ] Support URL: same host `/support`

## F. Submit

```bash
npm run eas:submit -- --platform ios
```

Then **Add for Review** — **`docs/submit-ios.md`**

## Optional before submit

- [ ] Connect `acts.app` — **`docs/connect-acts-app-domain.md`**
- [ ] Preview build first: `npm run eas:build:preview -- --platform ios`
