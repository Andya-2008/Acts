# Seed task catalog to Firestore

This uploads the full catalog from `scripts/task-catalog-seed.json` (active and deactivated acts) into:

| Cadence | Firestore path |
|---------|----------------|
| Daily | `tasks/dailyTask/dailyTask/{taskId}` |
| Weekly | `tasks/weeklyTask/weeklyTask/{taskId}` |
| Monthly | `tasks/monthlyTask/monthlyTask/{taskId}` |

The app reads these paths at runtime. Client apps **cannot** write here (`firestore.rules`); the seed script uses the **Admin SDK**.

---

## What you need

1. **Firebase project** — same one as your app (`EXPO_PUBLIC_FIREBASE_PROJECT_ID` in `.env`).
2. **Service account key** (JSON) from [Firebase Console](https://console.firebase.google.com) → ⚙️ Project settings → **Service accounts** → **Generate new private key**.
3. Save the file **outside git**, e.g. `scripts/acts-firebase-admin.json` (this path is gitignored).

Give the service account a role that can write Firestore, e.g. **Cloud Datastore User** (Firebase Console → IAM, or use the default Firebase Admin SDK service account).

---

## Steps (Windows PowerShell)

From the repo root:

```powershell
# 1. Install dev dependency (once)
npm install

# 2. Point at your service account key (each terminal session)
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\Users\andre\source\Acts\scripts\acts-firebase-admin.json"

# 3. Preview — no writes
npm run seed:tasks:dry

# 4. Upload (merge — safe to run again)
npm run seed:tasks
```

If you do not use `.env` for `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, set:

```powershell
$env:FIREBASE_PROJECT_ID = "your-firebase-project-id"
```

---

## After upload

1. Open Acts on a device or simulator (signed in).
2. Go to **Tasks**.
3. Pull to refresh (reloads catalog).
4. If you see **Sync suggested acts**, tap it to copy new acts into `userInfo/{uid}/tasks/`.

New acts join the rotation pool by `sortKey` and cadence; users may not see every new act on the home roster immediately.

---

## Editing or adding more acts

1. Add objects to `scripts/task-catalog-seed.json` (match existing fields; use new `task_00000XX` ids).
2. Set `cadence` to `daily`, `weekly`, or `monthly`.
3. Run `npm run seed:tasks` again.

Optional: mirror new entries in `features/tasks/constants/taskCatalog.ts` for reference in the repo (the app does not read that file at runtime).

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Missing GOOGLE_APPLICATION_CREDENTIALS` | Set env var to your JSON key path |
| `PERMISSION_DENIED` | Service account needs Firestore write role |
| Acts not showing new tasks | Sync suggested acts; check `active: true` and age/traits filters |
| Wrong project | Verify `EXPO_PUBLIC_FIREBASE_PROJECT_ID` matches the console project |
