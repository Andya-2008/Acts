# Legal pages (Privacy, Terms, Support)

Static pages live in the repo folder **`legal/`**.

| Page | Live now | After custom domain |
|------|----------|---------------------|
| Privacy | `https://acts-d7c7f.web.app/privacy` | `https://acts.app/privacy` |
| Terms | `https://acts-d7c7f.web.app/terms` | `https://acts.app/terms` |
| Support | `https://acts-d7c7f.web.app/support` | `https://acts.app/support` |

The app defaults to **`acts-d7c7f.web.app`** until you set `EXPO_PUBLIC_LEGAL_BASE_URL=https://acts.app` and rebuild. See **`docs/connect-acts-app-domain.md`**.

## Deploy to Firebase Hosting

1. Point your domain **`acts.app`** at Firebase Hosting (Firebase Console → Hosting → Add custom domain).
2. From the project root:

```bash
firebase deploy --only hosting
```

3. Confirm in a browser: `https://acts.app/privacy`, `/terms`, `/support`.

Use the same URLs in **App Store Connect** (Privacy Policy URL, Support URL).

## Override URLs

Set in `.env` and EAS environment variables for production:

- `EXPO_PUBLIC_LEGAL_BASE_URL`
- or individual `EXPO_PUBLIC_PRIVACY_POLICY_URL`, `EXPO_PUBLIC_TERMS_OF_SERVICE_URL`, `EXPO_PUBLIC_SUPPORT_URL`

Restart Metro or run a new EAS build after changing env vars.
