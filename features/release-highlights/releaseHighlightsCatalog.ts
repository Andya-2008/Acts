import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

type IonName = NonNullable<ComponentProps<typeof Ionicons>['name']>;

export type ReleaseHighlightSlide = {
  icon: IonName;
  title: string;
  body: string;
};

export type ReleaseHighlightPack = {
  /** Must match `app.json` version for the build users installed. */
  version: string;
  headline: string;
  slides: ReleaseHighlightSlide[];
};

/**
 * Only list releases with meaningful UX changes. Omit patch/minor releases that do not
 * warrant a walkthrough — those users simply won't see a what's-new screen.
 */
export const RELEASE_HIGHLIGHT_CATALOG: ReleaseHighlightPack[] = [
  {
    version: '1.0.7',
    headline: "What's new in Acts 1.0.7",
    slides: [
      {
        icon: 'phone-portrait-outline',
        title: 'Verified mobile number',
        body: 'New sign-ups verify a mobile number by text message. If you already saved a number on your profile, you are all set.',
      },
      {
        icon: 'grid-outline',
        title: 'Home screen widgets',
        body: 'Add Acts widgets on iOS or Android to see your streak and suggested acts without opening the app.',
      },
      {
        icon: 'gift-outline',
        title: 'Rewards',
        body: 'The Kindness Arcade is now called Rewards — same seeds, themes, and perks, clearer name.',
      },
      {
        icon: 'cloud-download-outline',
        title: 'Update reminders',
        body: 'When a newer version of Acts is on the App Store, we let you know so you can stay current.',
      },
      {
        icon: 'crop-outline',
        title: 'Profile photo crop',
        body: 'When you pick a profile picture, you can crop and center it before saving.',
      },
    ],
  },
  {
    version: '1.0.6',
    headline: "What's new in Acts 1.0.6",
    slides: [
      {
        icon: 'people-outline',
        title: 'Discover new friends',
        body: 'The Friends tab now suggests people you may know — starting with mutual friends — so it is easier to grow your circle.',
      },
      {
        icon: 'person-add-outline',
        title: 'Invite join alerts',
        body: 'When someone signs up from your invite link, Acts lets you know right away with a quick way to add them as a friend.',
      },
      {
        icon: 'notifications-outline',
        title: 'Smarter notifications',
        body: 'Tapping a notification — like a new deed post — takes you straight to the right place instead of a blank screen.',
      },
      {
        icon: 'settings-outline',
        title: 'Account controls',
        body: 'Change your password, username, or email from Settings → Account. Sign-up also gives clearer messages if an email or phone is already taken.',
      },
    ],
  },
  {
    version: '1.0.5',
    headline: "What's new in Acts 1.0.5",
    slides: [
      {
        icon: 'gift-outline',
        title: 'Invite rewards',
        body: 'Share your invite link and earn seeds when friends join Acts and connect with you.',
      },
      {
        icon: 'leaf-outline',
        title: 'First-act spotlight',
        body: 'New members see an easy first task highlighted on the Tasks tab so they know where to begin.',
      },
      {
        icon: 'call-outline',
        title: 'Sign in your way',
        body: 'Use your username or phone number to sign in — not just your email.',
      },
      {
        icon: 'images-outline',
        title: 'Notification shortcuts',
        body: 'Open a deed, friend request, or activity straight from a push or your in-app inbox.',
      },
    ],
  },
];

export function getReleaseHighlightsForVersion(version: string): ReleaseHighlightPack | null {
  const trimmed = version.trim();
  return RELEASE_HIGHLIGHT_CATALOG.find((entry) => entry.version === trimmed) ?? null;
}
