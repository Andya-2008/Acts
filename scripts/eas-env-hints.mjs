#!/usr/bin/env node
/**
 * Prints eas env:create commands from .env (EXPO_PUBLIC_* only).
 * Run: npm run eas:env:hints
 * Paste output into terminal after reviewing — do not commit secrets.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const envPath = resolve(ROOT, '.env');

if (!existsSync(envPath)) {
  console.error('No .env file. Copy .env.example to .env and fill values first.');
  process.exit(1);
}

const vars = {};
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 1) continue;
  const key = t.slice(0, i).trim();
  if (!key.startsWith('EXPO_PUBLIC_')) continue;
  let val = t.slice(i + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  if (val) vars[key] = val;
}

const keys = Object.keys(vars).sort();
if (keys.length === 0) {
  console.error('No EXPO_PUBLIC_* entries with values in .env');
  process.exit(1);
}

console.log('\n# Create/update EAS env vars (run one block per environment)\n');
console.log('# Requires: eas login && eas project linked\n');

for (const environment of ['preview', 'production']) {
  console.log(`# --- ${environment.toUpperCase()} ---\n`);
  for (const name of keys) {
    const value = vars[name].replace(/'/g, "'\\''");
    console.log(
      `eas env:create --name ${name} --value '${value}' --environment ${environment} --visibility plaintext`,
    );
  }
  console.log('');
}

console.log('# Or bulk upload in Expo dashboard → Environment variables\n');
console.log('# After updating: run a new eas build (env is baked at build time)\n');
