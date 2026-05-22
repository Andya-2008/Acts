# Google Sign-In setup (Acts)

The app uses **Firebase Auth** + **expo-auth-session** (`GoogleSignInSection` on login and signup).

Project: **acts-d7c7f** · Bundle ID **com.FrogCOO.Acts** · URL scheme **acts**

---

## Expo Go does not support Google Sign-In

If you open the app with the **Expo Go** app (QR code from `npx expo start`), Google sign-in **will not work** — you will see errors like `redirect_uri_mismatch`, OAuth policy errors, or **“Something went wrong trying to finish signing in.”** Expo [documents](https://docs.expo.dev/guides/authentication/) that OAuth is not supported in Expo Go.

**What to do instead:**

**iPhone**

1. Build once: `eas build --profile preview --platform ios`
2. Install from the link on [expo.dev](https://expo.dev) (internal distribution) on your iPhone
3. On your computer: `npm run start:dev-client`
4. Open the **Acts** dev app (not Expo Go) → Sign in with Google

Native iOS uses redirect `com.googleusercontent.apps.<ios-client-id>:/oauthredirect` (not `acts://`). You do **not** add that to the Web client in Google Cloud—the **iOS OAuth client** handles it via bundle ID + URL scheme baked into the app.

**Android**

1. `eas build --profile preview --platform android`
2. Install the APK → `npm run start:dev-client` → open **Acts** dev app

Use **email/password** in Expo Go while testing other features.

Ensure `EXPO_PUBLIC_GOOGLE_*` vars are set in Expo → Environment variables → **preview**, and your Gmail is a **Test user** on the OAuth consent screen.

---

## Fix: “doesn’t comply with Google’s OAuth 2.0 policy”

Google shows this when a **Web** OAuth client is used inside a **native** app (iPhone/Android). The ID you copied from Firebase (`…apps.googleusercontent.com`) is usually the **Web** client — that is correct for Firebase, but **not** for `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` or `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.

You need **three different client IDs** (three rows in Google Cloud → Credentials):

| Variable | OAuth client type | Purpose |
|----------|-------------------|---------|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | **Web application** | Firebase + redirect URI + token exchange |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | **iOS** | Sign-in on iPhone (bundle `com.FrogCOO.Acts`) |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | **Android** | Sign-in on Android (package + SHA-1) |

**Do not** paste the Web client ID into the iOS or Android env vars.

### Checklist (do in order)

#### 1. OAuth consent screen

[OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent?project=acts-d7c7f)

1. **User type:** External (typical) or Internal (Workspace only).
2. Fill **App name**, **User support email**, **Developer contact email**.
3. **Scopes:** keep defaults (`openid`, `email`, `profile`) — do not add restricted scopes unless you complete verification.
4. **Test users** (if app is in **Testing**): add every Gmail address you sign in with under **Test users → Add users**. Accounts not listed cannot sign in while the app is in Testing.
5. Save. You do not need to publish to Production for your own testing if test users are added.

#### 2. Web client (you likely have this already)

[Credentials](https://console.cloud.google.com/apis/credentials?project=acts-d7c7f) → **Web client** (or create **OAuth client ID → Web application**).

- Copy ID → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env`.
- Under **Authorized redirect URIs** on the **Web** client, add **only** this HTTPS URL for Expo Go:
  - `https://auth.expo.io/@andrewhyun114/acts`

  Google will **reject** `acts://oauthredirect` and `com.FrogCOO.Acts:/oauthredirect` on a Web client (they must be `http`/`https` with a real domain). Remove those if you added them.

  **Development builds** use custom schemes validated by your **iOS/Android** OAuth clients (bundle ID / package + SHA-1), not the Web redirect list.

#### 3. iOS client (required on iPhone)

**Create credentials → OAuth client ID → iOS**

| Field | Value |
|-------|--------|
| Bundle ID | `com.FrogCOO.Acts` |

Copy the new client ID (different from the Web one) → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.

Rebuild the dev client after setting this (so `app.config.js` adds the reversed Google URL scheme):

```powershell
npx expo start -c
# If using EAS dev build:
eas build --profile preview --platform ios
```

#### 4. Android client (required on Android)

**Create credentials → OAuth client ID → Android**

| Field | Value |
|-------|--------|
| Package name | `com.FrogCOO.Acts` |
| SHA-1 | From your debug or release keystore |

Debug SHA-1 (local builds on Windows — use Android Studio’s `keytool` if `keytool` is not on PATH):

```powershell
& "${env:ProgramFiles}\Android\Android Studio\jbr\bin\keytool.exe" -list -v `
  -keystore "$env:USERPROFILE\.android\debug.keystore" `
  -alias androiddebugkey -storepass android -keypass android
```

Copy the **SHA1:** line (format `AA:BB:CC:…`) into the Android OAuth client. Copy the Android client ID → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.

**EAS / Play Store builds** use a different certificate — add that SHA-1 too (`eas credentials` or Play Console → App signing).

### Verify Android client ownership (Project Checkup)

If **Project Checkup → App security** lists unverified `com.FrogCOO.Acts` Android clients, open each client in [Credentials](https://console.cloud.google.com/apis/credentials?project=acts-d7c7f) and complete **Verify ownership** (or delete duplicate/old Android clients you no longer use).

Add **both** debug and release SHA-1 if you test debug and store builds.

#### 5. Firebase

[Authentication → Sign-in method → Google](https://console.firebase.google.com/project/acts-d7c7f/authentication/providers) — **Enabled**.

The **Web client ID** shown there must match `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

#### 6. Restart and test

```powershell
npx expo start -c
```

Sign in with a Gmail that is a **test user** (if the consent screen is still in Testing).

---

## 1. Firebase Console

1. [Firebase Console](https://console.firebase.google.com/project/acts-d7c7f/authentication/providers) → **Authentication** → **Sign-in method**.
2. Enable **Google**.
3. Copy the **Web client ID** → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env`.
4. Under **Authentication → Settings → Authorized domains**, ensure your domains are listed (localhost is fine for dev).

---

## 2. Environment variables

Local `.env` (restart Metro after changes):

```env
EXPO_PUBLIC_GOOGLE_SIGN_IN_ENABLED=true
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<Web application client>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<iOS client — different ID>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<Android client — different ID>
```

**EAS builds:** add the same `EXPO_PUBLIC_*` vars in [Expo → Environment variables](https://expo.dev) for preview/production.

---

## 3. Run the app

```powershell
npx expo start -c
```

Use a **development build** or **EAS build** on a device/simulator (Google Sign-In is unreliable in Expo Go).

If the browser shows **“Something went wrong trying to finish signing in”**, Google authenticated you but the app did not receive the redirect. Rebuild the dev client (`eas build --profile preview`) so Android intent filters / URL schemes are applied, then try again.

New Google accounts get a Firestore profile, **personalization** (`UserConfig: false`), then the **invite-a-friend** gate (same as email signup).

---

## 4. Other errors

| Symptom | Fix |
|---------|-----|
| OAuth 2.0 policy / `redirect_uri=exp://…` | **Expo Go:** add `https://auth.expo.io/@andrewhyun114/acts` to **Web** redirect URIs; or use a **dev build** |
| OAuth 2.0 policy (no exp:// in error) | Use **iOS** / **Android** client IDs on device — not Web; fix consent screen + test users |
| `redirect_uri_mismatch` | Add Metro’s `redirectUri` to **Web** client redirect URIs only |
| Button setup message under button | Set the native client ID for your platform (see checklist above) |
| `auth/api-key-not-valid` | Fix Firebase API key restrictions in Google Cloud |
| No ID token | Web client ID must match Firebase Google provider |
| `GOOGLE_EMAIL_REQUIRED` | Google account must share an email with the app |

---

## 5. App Store note

Update review notes when Google is enabled: testers can use **Sign in with Google** or email/password.
