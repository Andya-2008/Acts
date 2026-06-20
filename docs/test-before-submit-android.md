# Manual test before Google Play submit

Run on a **production** or **preview** Android build on a **physical device** (not Expo Go).

## Auth & account

- [ ] Sign up with email/password → profile created (no SMS verification required in 1.0.8)
- [ ] Sign in with **username** on returning account
- [ ] **Google sign-in** works (release SHA-1 registered in Google Cloud)
- [ ] Sign out and sign back in
- [ ] Forgot password email arrives and works
- [ ] **Delete account** (Settings → Account) — confirm profile is gone
- [ ] Optional: add phone in Account settings for contact friend matching

## 1.0.8 features

- [ ] **Home screen widgets** — add Acts streak and/or Acts to do widget; complete an act; widget updates
- [ ] **Tasks widget** — tap one act in the medium widget → app opens to that act in Tasks
- [ ] Widget text readable on light and dark launcher themes
- [ ] **Rewards** tab; seed purchases work (virtual currency only)
- [ ] **Profile photo crop** — pick photo → square crop → saves
- [ ] **No ads** — no rewarded ad UI

## Core app

- [ ] Tasks: roster loads, complete/uncomplete act, streak updates
- [ ] Onboarding preferences influence suggested acts (if wizard completed)
- [ ] Deed feed: view posts, react, comment
- [ ] Post to deed feed after completing act (if used)
- [ ] Friends: invite link, accept request, grow-friends prompts when ≤3 friends
- [ ] **Push notifications** — friend request / reaction / comment while app backgrounded (grant permission; social toggles on)
- [ ] Tap notification → correct screen
- [ ] Settings → Notifications inbox → same deep links
- [ ] Report post (submits without crash)
- [ ] Block user filters feed

## Legal links (Settings → About)

- [ ] Privacy, Terms, Support open in browser

## Deep links & invites

- [ ] Open `https://acts-d7c7f.web.app/join?invitedBy=<uid>` → **Get on Google Play** on Android
- [ ] After install, invite attribution connects on sign-up

## Android-specific

- [ ] Back gesture / system navigation behaves correctly
- [ ] Notification channels appear in system settings (Acts reminders, Friends & activity)
- [ ] Edge-to-edge layout: no content hidden under status bar or gesture bar
- [ ] Cold start and resume are stable (no white screen)
