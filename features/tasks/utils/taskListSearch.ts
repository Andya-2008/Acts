import type { ActTask } from '@/shared/types/task';

/** Case-insensitive match on title, details, category, and materials. */
export function taskMatchesSearchQuery(task: ActTask, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const haystack = [task.textShort, task.textLong, task.category, ...task.materials]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}
