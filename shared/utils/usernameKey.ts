/** Lowercase trimmed username used for usernames collection doc ids and lookups. */
export function normalizeUsernameKey(username: string): string {
  return username.trim().toLowerCase();
}
