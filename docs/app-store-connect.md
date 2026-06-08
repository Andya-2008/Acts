# App Store Connect — Acts (`com.FrogCOO.Acts`)

Use this while creating the app in [App Store Connect](https://appstoreconnect.apple.com). Copy text from the sections below. Items marked **YOU** cannot be done by automation and must be completed in Apple’s UI.

---

## Before you open App Store Connect

| Step | Status |
|------|--------|
| Enrolled in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year) | **YOU** |
| Accepted latest **Agreements** in App Store Connect → Business | **YOU** |
| Production iOS build: `eas build --profile production --platform ios` then `eas submit` | **YOU** |
| **Privacy Policy** hosted at a real HTTPS URL (not `example.com`) | **YOU** — **blocker** |
| **Support URL** or support email page | **YOU** — **blocker** |
| Screenshots (6.7", 6.5", 5.5" iPhone — Apple lists required sizes per device) | **YOU** |

---

## 1. Create the app record

**My Apps → + → New App**

| Field | Value |
|-------|--------|
| Platforms | iOS |
| Name | Acts |
| Primary language | English (U.S.) |
| Bundle ID | `com.FrogCOO.Acts` (register in [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) if missing) |
| SKU | `acts-ios-001` (any unique string you choose) |
| User Access | Full Access |

---

## 2. App Information

| Field | Suggested value |
|-------|-----------------|
| Name | Acts |
| Subtitle (30 chars) | Kindness as a daily habit |
| Category (primary) | Lifestyle |
| Category (secondary, optional) | Social Networking |
| Content Rights | **YOU** — confirm you have rights to all content in the app |
| Age Rating | Complete questionnaire — see § Age Rating below |
| Privacy Policy URL | **YOU** — e.g. `https://yourdomain.com/privacy` |
| License Agreement | Standard Apple EULA (unless you have a custom EULA) |

---

## 3. Pricing and Availability

| Field | Value |
|-------|--------|
| Price | Free |
| Availability | All countries you want (or start with United States) |

---

## 4. App Privacy (nutrition labels)

Based on current Acts behavior (Firebase Auth/Firestore/Storage, optional contacts, photos, local notifications). **YOU** must confirm in the questionnaire.

| Data type | Collected? | Linked to user? | Used for | Notes |
|-----------|------------|-----------------|----------|--------|
| Contact info (email, phone, name) | Yes | Yes | Account, app functionality | Profile + auth |
| User content (photos, posts, comments) | Yes | Yes | App functionality | Deed feed, profile |
| Contacts (address book) | Optional | Yes | App functionality | Only if user runs “Find from contacts” |
| User ID | Yes | Yes | Account | Firebase uid |
| Product interaction | Yes | Yes | Analytics optional — only if you add analytics later |

**Third-party partners:** Firebase / Google (authentication, database, file storage).

**Tracking:** No (unless you add ads or cross-app tracking later).

Privacy Policy URL must match what you declare here.

---

## 5. Version metadata

### What's New (1.0.7)

Copy-paste from **`docs/app-store-whats-new-1.0.7.md`**.

**Contains Ads:** No (1.0.7 ships with `EXPO_PUBLIC_REWARDED_ADS_ENABLED` off).

---

## 5.1. Version 1.0.0 — Prepare for Submission (reference)

### Screenshots — **YOU**

Apple requires device-specific screenshots. Capture from a real device or simulator:

- Tasks tab (acts list)
- Deed feed with a post
- Profile / service rank
- Friends or get-started screen

Minimum sets: 6.7" Display (iPhone 15 Pro Max class) — check **Media Manager** for exact sizes Apple requires this year.

### Promotional text (170 chars, optional, can change anytime)

```
Build a streak of good deeds. Complete daily acts, share photos with friends, and grow your service rank on Acts.
```

### Description (4000 chars max)

```
Acts helps you build kindness into everyday life through small, doable acts—and share the journey with people you trust.

DAILY ACTS
• Get a personalized roster of good deeds (daily, weekly, and monthly).
• Check acts off when you’re done and build a completion streak.
• Earn seeds and lifetime XP as you show up for others and yourself.

DEED FEED
• Share a photo when you complete an act so friends can celebrate with you.
• React to friends’ posts and join the conversation with comments.

FRIENDS
• Add friends by username, invite link, or contacts on Acts.
• Control who sees your feed and profile in Privacy settings.

YOUR PROFILE
• Track your service rank, streak, and progress.
• Customize appearance and manage notifications.

SAFETY
• Block users and report posts you don’t want to see.
• Control profile visibility (friends-only vs only you) for feed and stats.

Acts is built for people who want accountability and community around doing good—not another endless scroll. Sign up with email, add friends, and start with one small act today.
```

### Keywords (100 chars, comma-separated, no spaces after commas)

```
kindness,good deeds,habits,streak,friends,community,volunteer,gratitude,acts of kindness,charity
```

### Support URL — **YOU**

Must load in a browser. Options:

- `mailto:andrewhyun@live.com` is **not** valid as Support URL
- Use a simple page: `https://yourdomain.com/support` with email + FAQ
- Or a Notion/Carrd page

### Marketing URL (optional) — **YOU**

e.g. `https://yourdomain.com` or same as invite landing page

### Version

| Field | Value |
|-------|--------|
| Version | 1.0.0 |
| Copyright | `2026 Andrew Hyun` (adjust year/name) |

### Build — **YOU**

Select the build uploaded via **EAS Submit** (`eas submit --platform ios --profile production`).

### App Review Information — **YOU**

| Field | Value |
|-------|--------|
| First name | Andrew |
| Last name | Hyun |
| Phone | Your phone |
| Email | andrewhyun@live.com |
| Sign-in required? | Yes |
| Demo account — **required** for review | **YOU** — create a test account Apple can use |

**Demo account notes (paste in “Notes”):**

```
Test account for App Review:
Email: [CREATE A DEDICATED TEST EMAIL]
Password: [STRONG PASSWORD]

Steps: Sign in → complete onboarding if shown → add a friend via username or skip friends intro → open Tasks to see acts → optional Deed Feed.

Google Sign-In is disabled in this build. Email/password only.

Contacts permission is optional (Friends → Find from contacts).
```

Replace bracketed values before submit.

### Export Compliance

| Question | Answer |
|----------|--------|
| Uses encryption? | Yes (HTTPS) |
| Exempt? | Yes — standard encryption only (`ITSAppUsesNonExemptEncryption` is false in app) |

In App Store Connect this is usually: **“Your app uses encryption” → Yes → qualifies for exemption”** (or use the exemption flow matching standard HTTPS/TLS only).

### Content & age

| Field | Guidance |
|-------|----------|
| User-generated content | Yes (photos, captions, comments) |
| Moderation | Report + block in app; `deedReports` in Firestore for staff |

---

## 6. Age Rating questionnaire (summary)

Answer honestly in Apple’s wizard. Expect something like **12+** or **13+** because of:

- Social networking (friends, feed)
- User-generated content (photos)
- Unrestricted web access: No (unless you add in-app browser)

Typical answers for Acts-like apps:

- Cartoon/fantasy violence: None
- Social networking: Yes
- User-generated content: Yes → moderation: Yes (report/block)

---

## 7. Pre-submit checklist (in order)

| Step | Item | Doc / command |
|------|------|----------------|
| 1 | Host legal pages | `npm run firebase:deploy:hosting` — see `docs/legal-hosting.md` |
| 2 | Deploy Firestore + Storage rules | `npm run firebase:deploy:rules-storage` |
| 3 | Set EAS **Preview** + **Production** env vars | `docs/eas-production-checklist.md` |
| 4 | Production iOS build | `npm run eas:build:production -- --platform ios` |
| 5 | Test on device (dev/preview build first) | `npm run eas:build:development -- --platform ios` + `npm run start:dev-client` |
| 6 | App Review demo account | § App Review Information below |
| 7 | Test delete account | Settings → Account |
| 8 | Privacy + Support URLs in App Store Connect | `https://acts.app/privacy`, `https://acts.app/support` |
| 9 | Screenshots | `docs/screenshots.md` |
| 10 | App Privacy questionnaire | `docs/app-privacy-questionnaire.md` |
| 11 | Demo account + Review Notes | `docs/app-review-demo-account.md` |
| 12 | Manual QA on device | `docs/test-before-submit.md` |
| 13 | Run `npm run preflight:store` | Legal URLs + local `.env` |
| 14 | Build, upload, submit | `docs/submit-ios.md` |
| — | **Full execution list** | `docs/execute-now.md` |

---

## 8. Submit

See **`docs/submit-ios.md`** for the full flow (`eas build` → `eas submit` → Add for Review).

---

## Quick reference (from repo)

| Item | Value |
|------|--------|
| Bundle ID | `com.FrogCOO.Acts` |
| Version | 1.0.0 |
| Developer (in-app) | Andrew Hyun |
| Contact | andrewhyun@live.com |
| EAS project | `c90a1cdf-711c-4542-b42f-c05bd2a82420` |
