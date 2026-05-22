# Connect acts.app to Firebase Hosting

Legal pages and in-app About links work today at **`https://acts-d7c7f.web.app`**. Connect **`acts.app`** when you own the domain.

## 1. Firebase Console

1. [Firebase Console](https://console.firebase.google.com/project/acts-d7c7f/hosting) → **Hosting**
2. **Add custom domain** → enter `acts.app` (and `www.acts.app` if you use www)
3. Copy the **TXT** and **A** records Firebase shows

## 2. DNS (your registrar)

Add the records exactly as Firebase lists them. Propagation can take up to 24–48 hours (often faster).

## 3. Verify

When Firebase shows **Connected**:

```bash
npm run firebase:deploy:hosting
npm run preflight:store
```

Preflight should show ✓ for `https://acts.app/privacy`.

## 4. Update app + App Store

1. **EAS** — set for Preview + Production:
   ```
   EXPO_PUBLIC_LEGAL_BASE_URL=https://acts.app
   ```
2. **New iOS build** — env is baked at build time:
   ```bash
   npm run eas:build:production -- --platform ios
   ```
3. **App Store Connect** — Privacy Policy URL and Support URL → `https://acts.app/privacy` and `/support`

Until step 4, keep using `https://acts-d7c7f.web.app` everywhere (already the build default).
