# While the 1.0.5 iOS build runs

Build tracker: https://expo.dev/accounts/andrewhyun114/projects/acts/builds/204e67db-6d5b-4640-8b7e-1acac7990cc5  
Target: **1.0.5 (16)** · production · store

Check status:

```bash
npm run eas:build:status
```

Look for `"status": "FINISHED"`.

---

## Checklist (App Store Connect — no build required)

- [ ] Create version **1.0.5** in App Store Connect (if missing)
- [ ] Paste **What's New** — `docs/app-store-whats-new-1.0.5.md`
- [ ] Upload screenshots if needed — `docs/screenshots.md`
- [ ] App Privacy questionnaire — `docs/app-privacy-questionnaire.md`
- [ ] Create **demo account** — `docs/app-review-demo-account.md` (do on device once you can install the build)

---

## When status is FINISHED

### 1. Install

- TestFlight (if this build is on your internal/external track), or  
- Open the build page → **Install** / download artifact.

### 2. QA (~30 min)

`docs/test-before-submit.md` — must pass before submit.

High-signal 1.0.5 checks:

- Sign in with **username** and **phone** (not only email)
- Invite link `/join?invitedBy=` → friend reward after accept
- Push / notification inbox → deed highlight or Friends
- First-act spotlight (new signup)
- Seasonal challenge optional photo

### 3. Submit binary

```bash
npm run eas:submit:ios:latest
```

### 4. Attach in App Store Connect

- Version **1.0.5** → **Build** → select build **16**
- App Review notes + demo credentials
- Export compliance (standard encryption: No / exempt)
- **Add for Review**

Full flow: `docs/submit-ios.md` · release checklist: `docs/release-1.0.5.md`

---

## Recommended before the *next* EAS build

Commit and push all local 1.0.5 changes so the EAS “Commit” field matches what you shipped:

```bash
git status
git add -A
git commit -m "Release 1.0.5: growth, security, polish"
git push origin main
```

(Only if you are ready to publish the branch; not required for build 16 if it already uploaded your working tree.)
