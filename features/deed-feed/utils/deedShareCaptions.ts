import type { ActTask } from '@/shared/types/task';

function sentenceCase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function verbPhrase(textShort: string): string {
  const trimmed = textShort.trim();
  if (!trimmed) {
    return 'did something kind';
  }
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/** Default caption when opening the deed share sheet. */
export function defaultDeedShareCaption(task: ActTask): string {
  const base = task.textShort.trim();
  if (!base) {
    return 'Did a small act of kindness today.';
  }
  return `Did it: ${sentenceCase(base)}`;
}

/** One-tap caption presets for the share sheet. */
export function deedShareCaptionTemplates(task: ActTask): string[] {
  const base = task.textShort.trim();
  if (!base) {
    return [
      'Did a small act of kindness today.',
      'Showing up for others today.',
      'One small deed at a time.',
    ];
  }

  const titled = sentenceCase(base);
  const phrase = verbPhrase(base);
  const candidates = [
    `Did it: ${titled}`,
    `Today I ${phrase}`,
    `Small win — ${titled}`,
    titled,
    `Feeling good after I ${phrase}`,
  ];

  const seen = new Set<string>();
  return candidates.filter((caption) => {
    const key = caption.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).slice(0, 4);
}
