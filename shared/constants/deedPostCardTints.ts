import { actsTheme } from '@/shared/theme/actsTheme';

/** Allowed tint ids stored on `deedPosts.cardTintId` (light backgrounds only). */
export const DEED_CARD_TINT_IDS = [
  'mint',
  'blush',
  'sky',
  'lavender',
  'cream',
  'peach',
  'sea',
  'lemon',
] as const;

export type DeedCardTintId = (typeof DEED_CARD_TINT_IDS)[number];

const isTintId = (v: string): v is DeedCardTintId =>
  (DEED_CARD_TINT_IDS as readonly string[]).includes(v);

/** Hex values for each tint (pastel / light). */
export const DEED_CARD_TINT_HEX: Record<DeedCardTintId, string> = {
  mint: '#ECFDF5',
  blush: '#FFF1F2',
  sky: '#EFF6FF',
  lavender: '#F5F3FF',
  cream: '#FFFBEB',
  peach: '#FFF7ED',
  sea: '#F0FDFA',
  lemon: '#FEFCE8',
};

export const DEFAULT_DEED_CARD_BACKGROUND = actsTheme.colors.surface;

export function parseDeedCardTintId(raw: unknown): DeedCardTintId | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const id = raw.trim();
  return isTintId(id) ? id : null;
}

export function deedCardBackgroundForTintId(tintId: DeedCardTintId | null | undefined): string {
  if (tintId == null) {
    return DEFAULT_DEED_CARD_BACKGROUND;
  }
  return DEED_CARD_TINT_HEX[tintId] ?? DEFAULT_DEED_CARD_BACKGROUND;
}

export const DEED_CARD_TINT_OPTIONS: { id: DeedCardTintId; label: string }[] = [
  { id: 'mint', label: 'Mint' },
  { id: 'blush', label: 'Blush' },
  { id: 'sky', label: 'Sky' },
  { id: 'lavender', label: 'Lilac' },
  { id: 'cream', label: 'Cream' },
  { id: 'peach', label: 'Peach' },
  { id: 'sea', label: 'Sea' },
  { id: 'lemon', label: 'Lemon' },
];
