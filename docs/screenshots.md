# App Store screenshots

Apple requires screenshots per **display size**. Check **App Store Connect → your version → Screenshots** for the exact sizes required this year (often **6.7"** and **6.5"** iPhone, sometimes more).

## Recommended screens (4–6 shots)

Capture in order that tells a story:

| # | Screen | How to get there |
|---|--------|------------------|
| 1 | **Tasks** — roster with acts visible | Tasks tab (default home) |
| 2 | **Task complete** or streak | Complete one act; show checkmark / reward if possible |
| 3 | **Deed feed** — at least one post | Deed Feed tab (seed with a test post if empty) |
| 4 | **Profile** — rank / XP / streak | Profile tab |
| 5 | **Friends** (optional) | Friends tab in deed feed or friends list |
| 6 | **Settings / Privacy** (optional) | Shows you take privacy seriously |

Use a **production or preview** build with real-looking data (not dev banners).

## Capture on Mac (Simulator)

1. Xcode → **Window → Devices and Simulators** → boot **iPhone 15 Pro Max** (6.7") or the device Apple lists.
2. Install your EAS build or run simulator build.
3. Navigate to each screen.
4. **File → Save Screen** or `Cmd + S` in Simulator.

## Capture on physical iPhone

1. Install TestFlight or internal EAS build.
2. Navigate to each screen.
3. **Side button + Volume up** screenshot.
4. AirDrop to Mac for upload.

## Upload

1. App Store Connect → **Acts** → **1.0.0** → **Screenshots**.
2. Drag PNG/JPEG into each required size slot.
3. Same set can often be scaled; Apple may auto-fill smaller sizes — verify previews.

## Tips

- Use **light mode** or **automatic** consistently across shots.
- Hide status bar clutter if possible (full battery, 9:41 AM is fine).
- No placeholder “Lorem ipsum” — use real act titles from your catalog.
- If deed feed is empty, post one deed from a friend test account before capturing.

## Promotional text

See `docs/app-store-connect.md` § Promotional text and Description (ready to paste).

---

## Android (Google Play)

Play Console requires **phone** screenshots (no tablet required for phone-only app).

### Recommended sizes

Check **Play Console → Store listing** for current requirements. Typically:

| Type | Size |
|------|------|
| Phone screenshots | Min 2 — often 1080×1920 or 1440×2560 (portrait) |
| Feature graphic | 1024×500 PNG/JPEG |
| App icon | 512×512 PNG |

### Capture on Android device

1. Install production or preview AAB (internal testing link or `adb install`).
2. Navigate to the same story screens as iOS (Tasks, deed feed, profile, widgets optional).
3. **Power + Volume down** screenshot.
4. Transfer to desktop for upload.

### Capture with Android Emulator

1. Android Studio → Device Manager → Pixel 6 or similar.
2. Install the EAS build or run `npm run android` on a dev client.
3. Emulator **⋯** → **Screenshot** or use Studio’s capture tool.

### Upload

1. Play Console → **Acts** → **Store listing** → phone screenshots.
2. Upload 4–6 PNG/JPEG files in story order.
3. Add **Feature graphic** (marketing banner) — separate from in-app screenshots.

See also `docs/play-store-console.md` and `docs/test-before-submit-android.md`.
