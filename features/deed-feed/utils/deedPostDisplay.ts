import { deedCardBackgroundForTintId } from '@/shared/constants/deedPostCardTints';
import type { DeedPost } from '@/shared/types/deedPost';

/** Avatar URL: denormalized on post, then profile `userInfo`, then viewer fallback for own posts. */
export function resolveDeedPostCardBackground(post: DeedPost): string {
  return deedCardBackgroundForTintId(post.cardTintId ?? null);
}

export function resolveDeedPostAvatar(
  post: DeedPost,
  profilePicByUid: Record<string, string | null> | undefined,
  viewerUid: string | undefined,
  viewerFallback: string | null,
): string | null {
  const fromPost = post.authorProfilePicUrl?.trim();
  if (fromPost) {
    return fromPost;
  }
  const fromMap = profilePicByUid?.[post.authorUid];
  if (fromMap) {
    return fromMap;
  }
  if (viewerUid && post.authorUid === viewerUid && viewerFallback?.trim()) {
    return viewerFallback.trim();
  }
  return null;
}

export function formatDeedPostDate(createdAt: DeedPost['createdAt']): string {
  if (createdAt == null) {
    return '';
  }
  try {
    return createdAt.toDate().toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function formatDeedPostTime(createdAt: DeedPost['createdAt']): string {
  if (createdAt == null) {
    return '';
  }
  try {
    return createdAt.toDate().toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
