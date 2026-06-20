/** Show grow-your-circle prompts while the user's friend list is still small. */
export const SMALL_FRIEND_CIRCLE_MAX = 3;

export function shouldShowFriendsCirclePrompt(friendCount: number): boolean {
  return friendCount <= SMALL_FRIEND_CIRCLE_MAX;
}
