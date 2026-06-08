import type { ActAppearanceColorPresetId } from '@/shared/theme/appearancePalettes';
import type { ActsAppSettings } from '@/shared/types/actsSettings';

export function isAppearanceTrialActive(
  settings: Pick<ActsAppSettings, 'appearanceTrialExpiresAt'>,
  now = new Date(),
): boolean {
  const raw = settings.appearanceTrialExpiresAt?.trim();
  if (!raw) {
    return false;
  }
  const expires = Date.parse(raw);
  return !Number.isNaN(expires) && now.getTime() < expires;
}

/** Preset shown in UI: active trial overrides equipped preset until it expires. */
export function resolveActiveAppearancePreset(
  settings: Pick<ActsAppSettings, 'appearanceColorPreset' | 'appearanceTrialPresetId' | 'appearanceTrialExpiresAt'>,
  now = new Date(),
): ActAppearanceColorPresetId {
  if (
    isAppearanceTrialActive(settings, now) &&
    settings.appearanceTrialPresetId
  ) {
    return settings.appearanceTrialPresetId;
  }
  return settings.appearanceColorPreset;
}

export function appearanceTrialRemainingLabel(
  settings: Pick<ActsAppSettings, 'appearanceTrialExpiresAt'>,
  now = new Date(),
): string | null {
  if (!isAppearanceTrialActive(settings, now)) {
    return null;
  }
  const expires = Date.parse(settings.appearanceTrialExpiresAt!.trim());
  const hoursLeft = Math.max(1, Math.ceil((expires - now.getTime()) / (60 * 60 * 1000)));
  if (hoursLeft >= 24) {
    return 'Trial · 24h left';
  }
  return `Trial · ${hoursLeft}h left`;
}
