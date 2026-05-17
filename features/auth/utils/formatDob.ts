/** Formats a date as `MM/DD/YYYY` to match existing `userInfo.DOB` strings in Firestore. */
export function formatDobForUserInfo(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
