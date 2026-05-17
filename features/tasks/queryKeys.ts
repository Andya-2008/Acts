export const tasksQueryKeys = {
  all: ['tasks'] as const,
  list: (uid: string) => [...tasksQueryKeys.all, uid] as const,
  /** Global catalog docs under `tasks/{dailyTask|weeklyTask|monthlyTask}/…`. */
  firestoreCatalog: () => [...tasksQueryKeys.all, 'firestoreCatalog'] as const,
};
