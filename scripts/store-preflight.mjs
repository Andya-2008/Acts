#!/usr/bin/env node
/**
 * Pre-submit checks for App Store / TestFlight.
 * Run: npm run preflight:store
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const REQUIRED_ENV = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const RECOMMENDED_ENV = [
  'EXPO_PUBLIC_FIREBASE_API_KEY_IOS',
  'EXPO_PUBLIC_LEGAL_BASE_URL',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
];

function loadDotEnv() {
  const path = resolve(ROOT, '.env');
  if (!existsSync(path)) {
    return {};
  }
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function legalBases(env) {
  const seen = new Set();
  const add = (u) => {
    const b = (u ?? '').replace(/\/$/, '');
    if (b && !seen.has(b)) {
      seen.add(b);
      return b;
    }
    return null;
  };
  const bases = [];
  for (const u of [
    env.EXPO_PUBLIC_LEGAL_BASE_URL,
    'https://acts.app',
    'https://acts-d7c7f.web.app',
  ]) {
    const b = add(u);
    if (b) bases.push(b);
  }
  return bases;
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    return { url, ok: res.ok, status: res.status };
  } catch (e) {
    return { url, ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

function fail(msg) {
  console.error(`✗ ${msg}`);
}

function pass(msg) {
  console.log(`✓ ${msg}`);
}

function warn(msg) {
  console.warn(`⚠ ${msg}`);
}

let exitCode = 0;

console.log('\nActs — App Store preflight\n');

let appVersion = '?';
try {
  const appJson = JSON.parse(readFileSync(resolve(ROOT, 'app.json'), 'utf8'));
  appVersion = appJson?.expo?.version ?? '?';
  pass(`app.json version: ${appVersion}`);
} catch {
  warn('Could not read app.json version');
}

const env = { ...loadDotEnv(), ...process.env };

const adsEnabled = (env.EXPO_PUBLIC_REWARDED_ADS_ENABLED ?? '').trim().toLowerCase() === 'true';
if (adsEnabled) {
  warn('EXPO_PUBLIC_REWARDED_ADS_ENABLED=true — 1.0.7 ships without ads; set false in Production');
} else {
  pass('Rewarded ads disabled (EXPO_PUBLIC_REWARDED_ADS_ENABLED not true)');
}

for (const key of REQUIRED_ENV) {
  const v = env[key]?.trim();
  if (!v) {
    fail(`Missing ${key} in .env (also set in EAS Preview + Production)`);
    exitCode = 1;
  } else if (key === 'EXPO_PUBLIC_FIREBASE_API_KEY' && v.startsWith('AlzaSy')) {
    fail(`${key} looks typo'd (AlzaSy → should be AIzaSy)`);
    exitCode = 1;
  } else {
    pass(`${key} is set locally`);
  }
}

for (const key of RECOMMENDED_ENV) {
  if (!env[key]?.trim()) {
    warn(`Missing ${key} (recommended for iOS / legal / Google)`);
  }
}

console.log('\nLegal pages (HTTPS):\n');

const paths = ['/privacy', '/terms', '/support'];
const bases = legalBases(env);
let anyLegalOk = false;

for (const base of bases) {
  let baseOk = true;
  for (const p of paths) {
    const result = await checkUrl(`${base}${p}`);
    if (result.ok) {
      pass(`${result.url}`);
      anyLegalOk = true;
    } else {
      fail(`${result.url} → ${result.status || result.error}`);
      baseOk = false;
    }
  }
  if (baseOk) {
    console.log(`  → Use in App Store Connect: ${base}/privacy , ${base}/support\n`);
    break;
  }
}

if (!anyLegalOk) {
  exitCode = 1;
  warn('Run: npm run firebase:deploy:hosting');
  warn('Connect acts.app in Firebase Hosting, or set EXPO_PUBLIC_LEGAL_BASE_URL=https://acts-d7c7f.web.app');
}

console.log('\nManual (cannot automate):\n');
console.log('  • EAS Production env vars match .env — docs/eas-production-checklist.md');
console.log('  • npm run eas:build:production -- --platform ios');
console.log('  • Demo account — docs/app-review-demo-account.md');
console.log(`  • Release checklist — docs/release-${appVersion}.md`);
console.log('  • QA — docs/test-before-submit.md');
console.log('  • Screenshots — docs/screenshots.md');
console.log('  • Submit — docs/submit-ios.md\n');

process.exit(exitCode);
