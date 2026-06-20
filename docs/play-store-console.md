# Google Play Console — Acts (`com.FrogCOO.Acts`)

Use this while creating and publishing the app in [Google Play Console](https://play.google.com/console). Copy text from the sections below. Items marked **YOU** must be completed in Google’s UI.

---

## Before you open Play Console

| Step | Status |
|------|--------|
| Google Play Developer account ($25 one-time) | **YOU** |
| Production Android build (AAB): `npm run eas:build:production:android` | **YOU** |
| **Privacy Policy** at HTTPS URL | **YOU** — same as iOS |
| **Support** URL or email | **YOU** |
| Phone screenshots (see `docs/screenshots.md` § Android) | **YOU** |

---

## 1. Create the app

**All apps → Create app**

| Field | Value |
|-------|--------|
| App name | Acts |
| Default language | English (United States) |
| App or game | App |
| Free or paid | Free |

Declarations: follow Play policies; no government / restricted content unless applicable.

---

## 2. Store listing

| Field | Suggested value |
|-------|-----------------|
| App name | Acts |
| Short description (80 chars) | Daily acts of kindness with friends — streaks, deeds, and rewards. |
| Full description | See § Full description below |
| App icon | 512×512 PNG — use `assets/images/icon.png` exported at size |
| Feature graphic | 1024×500 — **YOU** (brand + tagline) |
| Screenshots | Phone: min 2, max 8 — see `docs/screenshots.md` |
| Category | Lifestyle |
| Tags | kindness, habits, social, deeds (pick allowed tags) |
| Contact email | Your support email |
| Privacy policy URL | `https://acts.app/privacy` or `https://acts-d7c7f.web.app/privacy` |

### Full description (paste & trim to 4,000 chars)

```
Acts turns small good deeds into a daily habit you share with people you know.

Complete suggested acts of kindness each day, build your streak, and earn seeds and XP. Share photos and updates on the deed feed with friends. Home screen widgets show your streak and today’s acts at a glance.

WHAT YOU CAN DO
• Pick from a curated roster of daily acts matched to your interests
• Complete acts, keep your streak, and level up your service rank
• Connect with friends, react and comment on their deeds
• Customize your experience in Rewards with seeds you earn
• Optional reminders for daily acts and friend activity

Acts is free. No ads in this version. Virtual currency (seeds) is earned in-app only — not sold for real money.

Privacy policy: https://acts.app/privacy
Support: https://acts.app/support
```

---

## 3. App content (required policies)

| Section | Guidance |
|---------|----------|
| **Privacy policy** | URL must match store listing |
| **Ads** | **No** — 1.0.8 ships without AdMob |
| **App access** | All functionality available after sign-up; provide demo credentials in Play Console notes if needed (`docs/app-review-demo-account.md`) |
| **Content rating** | Complete IARC questionnaire — expect **Everyone** or **Teen** (social + UGC) |
| **Target audience** | 13+ recommended (social features) |
| **News app** | No |
| **COVID-19** | No |
| **Data safety** | See § Data safety |

---

## 4. Data safety (summary)

Align with iOS App Privacy (`docs/app-privacy-questionnaire.md`).

| Data | Collected | Shared | Purpose |
|------|-----------|--------|---------|
| Email, name, optional phone | Yes | No (Firebase) | Account |
| Photos, posts, comments | Yes | With friends per visibility | App functionality |
| Contacts | Optional, user-initiated | No | Friend suggestions |
| App interactions | Optional | Firebase Analytics if enabled | Analytics |

**Encryption in transit:** Yes (HTTPS).  
**Deletion:** Users can delete account in Settings.

---

## 5. Pricing & distribution

| Field | Value |
|-------|--------|
| Price | Free |
| Countries | Your target regions (or all) |
| Contains ads | No |
| In-app purchases | No (seeds are virtual, not Play Billing) |

---

## 6. Release tracks

| Track | Use |
|-------|-----|
| **Internal testing** | First upload via `eas submit` (`track: internal` in `eas.json`) |
| **Closed testing** | Small tester group before production |
| **Production** | Public Play Store |

---

## 7. Version release notes (1.0.8)

Paste from **`docs/play-store-whats-new-1.0.8.md`**.

---

## 8. Quick links

- Package: `com.FrogCOO.Acts`
- Play listing (after publish): `https://play.google.com/store/apps/details?id=com.FrogCOO.Acts`
- Submit workflow: `docs/submit-android.md`
- Android QA: `docs/test-before-submit-android.md`
