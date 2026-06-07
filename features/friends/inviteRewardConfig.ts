/** Medium-tier reward when someone you invited joins Acts and becomes your friend. */
export const INVITE_FRIEND_REWARD = {
  inviterSeeds: 30,
  inviterXp: 75,
  inviteeSeeds: 15,
} as const;

export function inviteRewardSummaryLine(): string {
  return `Earn ${INVITE_FRIEND_REWARD.inviterSeeds} seeds and ${INVITE_FRIEND_REWARD.inviterXp} XP when a friend joins from your link and you connect on Acts.`;
}
