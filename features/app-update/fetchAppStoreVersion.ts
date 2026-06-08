import { IOS_BUNDLE_ID, getAppStoreUrl } from '@/shared/config/appStore';

type AppStoreLookupResult = {
  version: string;
  storeUrl: string;
};

type ItunesLookupResponse = {
  resultCount?: number;
  results?: Array<{ version?: string; trackViewUrl?: string }>;
};

let cached: { result: AppStoreLookupResult; fetchedAt: number } | null = null;
const CACHE_MS = 60 * 60 * 1000;

/** Reads the latest published iOS version from Apple's lookup API. */
export async function fetchLatestAppStoreVersion(): Promise<AppStoreLookupResult | null> {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_MS) {
    return cached.result;
  }

  const url = `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(IOS_BUNDLE_ID)}`;
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as ItunesLookupResponse;
  const entry = data.results?.[0];
  const version = entry?.version?.trim();
  if (!version) {
    return null;
  }

  const result: AppStoreLookupResult = {
    version,
    storeUrl: entry?.trackViewUrl?.trim() || getAppStoreUrl(),
  };
  cached = { result, fetchedAt: now };
  return result;
}
