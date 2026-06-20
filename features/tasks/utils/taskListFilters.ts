import type { ActTask, TaskCadence, TaskDifficultyLevel } from '@/shared/types/task';

export type TaskListFiltersState = {
  /** Empty = any cadence. */
  cadences: TaskCadence[];
  /** Empty = any difficulty. */
  difficulties: TaskDifficultyLevel[];
  completion: 'all' | 'todo' | 'done';
  /** `needs` = catalog acts that suggest a memory photo. */
  photo: 'all' | 'needs' | 'optional';
  /** Empty = any category. */
  categories: string[];
};

export const DEFAULT_TASK_LIST_FILTERS: TaskListFiltersState = {
  cadences: [],
  difficulties: [],
  completion: 'todo',
  photo: 'all',
  categories: [],
};

export function filtersBeyondDefault(f: TaskListFiltersState): boolean {
  return (
    f.cadences.length > 0 ||
    f.difficulties.length > 0 ||
    f.categories.length > 0 ||
    f.photo !== 'all' ||
    f.completion === 'all' ||
    f.completion === 'done'
  );
}

export function taskMatchesListFilters(task: ActTask, f: TaskListFiltersState): boolean {
  if (f.cadences.length > 0 && !f.cadences.includes(task.cadence)) {
    return false;
  }
  if (f.difficulties.length > 0 && !f.difficulties.includes(task.difficulty)) {
    return false;
  }
  if (f.completion === 'todo' && task.completedAt != null) {
    return false;
  }
  if (f.completion === 'done' && task.completedAt == null) {
    return false;
  }
  if (f.photo === 'needs' && !task.picture) {
    return false;
  }
  if (f.photo === 'optional' && task.picture) {
    return false;
  }
  if (f.categories.length > 0 && !f.categories.includes(task.category)) {
    return false;
  }
  return true;
}

export function filtersAreActive(f: TaskListFiltersState): boolean {
  return filtersBeyondDefault(f);
}

export function activeFilterCount(f: TaskListFiltersState): number {
  return (
    f.cadences.length +
    f.difficulties.length +
    (f.completion !== 'todo' ? 1 : 0) +
    (f.photo !== 'all' ? 1 : 0) +
    f.categories.length
  );
}
