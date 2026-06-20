import type { Manifest } from 'expo-updates';

/** Stable id for a downloaded OTA bundle (used for dismiss storage). */
export function easUpdateIdentity(manifest: Manifest | undefined): string | null {
  if (!manifest) {
    return null;
  }
  if ('id' in manifest && typeof manifest.id === 'string' && manifest.id.trim()) {
    return manifest.id.trim();
  }
  if ('revisionId' in manifest && typeof manifest.revisionId === 'string' && manifest.revisionId.trim()) {
    return manifest.revisionId.trim();
  }
  return null;
}
