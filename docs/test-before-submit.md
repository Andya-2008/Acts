# Manual test before App Store submit

Run on a **preview** or **production** build on a real device (not Expo Go).

## Auth & account

- [ ] Sign in with **username** (not email) on returning account
- [ ] Sign in with **phone** (if saved on profile) on returning account
- [ ] **Sign up** with new email/password → profile created **without SMS verification**
- [ ] **Google or Apple sign-in** (if enabled) → enters app **without** a verify-phone gate
- [ ] Sign out and sign back in
- [ ] Forgot password email arrives and works
- [ ] **Delete account** (Settings → Account → type username → delete) — confirm you cannot sign in again and profile is gone
- [ ] Google Sign-In (if enabled in this build): sign in and sign out once
- [ ] Optional: add mobile number in **Settings → Account** for contact friend matching

## 1.0.8 features

- [ ] **Home screen widgets** — add streak and/or tasks widget; open app, complete an act; widget reflects change
- [ ] **Tasks widget** — tap a specific act in the medium widget → Tasks scrolls to that act (highlight ring)
- [ ] Widget text readable on light and dark backgrounds
- [ ] **Rewards** tab (nav title and header pill); seed purchases work (no real money)
- [ ] **Profile photo crop** — Settings → Account → pick photo → square crop → saves
- [ ] **No ads** — Rewards screen has no “watch ad” section; no App Tracking prompt on launch

## 1.0.5+ features

- [ ] Tasks: first-act spotlight (new account) scrolls to an act; dismiss or complete clears it
- [ ] Deed feed / Tasks: grow-friends prompt when ≤3 friends (after first act); share invite link
- [ ] Accept invite from `/join?invitedBy=` — inviter gets seeds/XP (after friendship)
- [ ] Tap push notification → correct screen; deed opens with post highlighted
- [ ] Settings → Notifications inbox → same deep links
- [ ] Seasonal challenges: log with optional photo; thumbnail on card
- [ ] Dark / Midnight theme: task chips and deed cards readable

## Friends gate (new signup)

- [ ] Friends intro appears after signup
- [ ] ✕ skips to main app
- [ ] Share invite → **Continue** appears; tap Continue → main app
- [ ] Add friend from contacts → can add another → Continue

## Core app

- [ ] Tasks: roster loads, complete/uncomplete act, streak updates
- [ ] Deed feed: view posts, react (if applicable)
- [ ] Post to deed feed after completing act (if used)
- [ ] Profile: stats, edit bio, profile photo
- [ ] Rewards: purchase with seeds (no real money)
- [ ] Settings → Privacy: block user filters feed
- [ ] Report post (submits without crash)

## Legal links (Settings → About)

- [ ] Support opens in browser
- [ ] Privacy Policy opens
- [ ] Terms open

## Permissions (deny once, allow once)

- [ ] Contacts — deny → app still usable
- [ ] Photos — pick profile image
- [ ] Notifications — optional

## Regression

- [ ] Cold start after kill app — still signed in
- [ ] No dev-only UI (e.g. XP adjust on Tasks)

## Demo account

- [ ] Credentials in `docs/app-review-demo-account.md` work on a fresh install

When all pass, proceed to `docs/submit-ios.md`.
