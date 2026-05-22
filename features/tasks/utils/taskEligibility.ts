import type { ActTask, TaskCatalogEntry } from '@/shared/types/task';
import type { UserInfoRead } from '@/shared/types/userInfo';

export function computeAgeFromDobMmDdYyyy(dob: string): number | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dob.trim());
  if (!m) {
    return null;
  }
  const month = Number(m[1]) - 1;
  const day = Number(m[2]);
  const year = Number(m[3]);
  const birth = new Date(year, month, day);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function normalizeTrait(s: string): string {
  return s.trim().toLowerCase();
}

export function userPersonalityStrings(user: UserInfoRead | null | undefined): string[] {
  if (!user) {
    return [];
  }
  const fromTraits = (user.Traits ?? []).map(normalizeTrait);
  const fromPersonality = (user.PersonalityTraits ?? []).map(normalizeTrait);
  return [...new Set([...fromTraits, ...fromPersonality])];
}

/** Catalog row as an `ActTask` probe for {@link taskMatchesUserProfile} (no Firestore fields). */
export function catalogEntryMatchesUser(entry: TaskCatalogEntry, user: UserInfoRead | null | undefined): boolean {
  const synthetic: ActTask = {
    ...entry,
    id: entry.taskId,
    photoUrl: null,
    deedFeedPostId: null,
    createdAt: null,
    completedAt: null,
  };
  return taskMatchesUserProfile(synthetic, user);
}

/** Whether this task should appear for the user (active, age band, traits). */
export function taskMatchesUserProfile(task: ActTask, user: UserInfoRead | null | undefined): boolean {
  if (!task.active) {
    return false;
  }
  const age = user?.DOB ? computeAgeFromDobMmDdYyyy(user.DOB) : null;
  if (age != null) {
    if (age < task.minAge || age > task.maxAge) {
      return false;
    }
  }
  const taskTraits = task.traits.map(normalizeTrait);
  if (taskTraits.includes('any')) {
    return true;
  }
  const userTraits = userPersonalityStrings(user);
  if (userTraits.length === 0) {
    return taskTraits.includes('any');
  }
  return taskTraits.some((t) => userTraits.includes(t));
}
