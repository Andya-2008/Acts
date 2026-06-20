# EAS Update (OTA)

Ship **JavaScript-only** fixes (copy, UI, light logic) without a new App Store / Play build. Native changes still require `eas build`.

Project: **acts** · EAS ID `c90a1cdf-711c-4542-b42f-c05bd2a82420`

## How it works

- **Runtime version** uses `appVersion` policy — OTA bundles only apply to installs with the **same** `app.json` version (e.g. `1.0.8`).
- **Channels** tie builds to update streams:
  - `production` — App Store / Play production builds
  - `preview` — internal TestFlight / APK testing
  - `development` — dev client (optional)
- On launch and when returning to the app, the client checks EAS Update. If a bundle is downloaded, users see **“Update ready — Restart now”** (no store visit).

## One-time: enable OTA in native builds

Existing store binaries **do not** include `expo-updates` until you ship a new build **after** this setup:

```bash
npm run eas:build:production:ios
npm run eas:build:production:android
```

Submit those builds as usual. Future JS-only changes can use OTA below.

## Publish an OTA update

From project root, on the branch you want to ship:

### Production (store users)

```bash
npm run eas:update:production -- --message "Fix win-back copy"
```

Uses channel `production` and EAS **Production** environment variables.

### Preview (internal testers)

```bash
npm run eas:update:preview -- --message "QA: task list tweak"
```

### Verify

```bash
npx eas-cli update:list --branch production --limit 5
```

Open a **release** build (not Expo Go, not Metro dev). Background the app and return, or cold-start — the restart prompt should appear after the bundle downloads.

## What OTA can and cannot do

| OK for OTA | Requires new native build |
|------------|---------------------------|
| React components, hooks, copy | New native modules / plugins |
| Firebase rules-only backend | `app.json` permission changes |
| Light client logic | Version bump when native code changed |
| Analytics event names | Widget native code, entitlements |

When you bump `app.json` `version` (e.g. `1.0.8` → `1.0.9`), publish a **new store build** first, then OTA updates for that version.

## Rollback

```bash
npx eas-cli update:republish --group <update-group-id>
```

List groups with `eas update:list`. Republish a known-good group to roll back JS.

## Related docs

- Build env & channels — `docs/eas-production-checklist.md`
- Store submit — `docs/submit-ios.md`, `docs/submit-android.md`
